"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";
import {
  buildExpandedCategoryIds,
  getDescendantCategoryIds,
  getDirectChildren,
  getPrimaryCategories,
  sortCategories,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

type NgoOption = { id: number; name: string };
type CategoryOption = FlatCategory;
type RegionOption = { id: number; name: string; is_visible: boolean | null };
type ProjectCategoryRow = { category_id: number };
type ProjectBolgeRow = { bolge_id: number };
type ProjectListItem = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  is_visible: boolean;
  ngo_id: number;
  regions: Array<{ id: number; name: string; is_visible: boolean | null }>;
  categoryIds: number[];
  categories: Array<{ id: number; name: string; parent_id: number | null; is_visible: boolean | null }>;
  ngo: { name: string; is_visible: boolean | null } | null;
  position: number | null;
};

type ProjectRow = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  is_visible: boolean | null;
  ngo_id: number;
  project_bolge:
  | Array<{
    bolge:
    | { id: number; name: string; is_visible: boolean | null }
    | { id: number; name: string; is_visible: boolean | null }[]
    | null;
  }>
  | null;
  position: number | null;
  ngo:
  | { name: string; is_visible: boolean | null }
  | { name: string; is_visible: boolean | null }[]
  | null;
  project_categories:
  | Array<{
    category:
    | { id: number; name: string; parent_id: number | null; is_visible: boolean | null }
    | { id: number; name: string; parent_id: number | null; is_visible: boolean | null }[]
    | null;
  }>
  | null;
};

type ProjectFormTab = "summary" | "basic" | "categories" | "regions";

const PROJECT_FORM_TABS: Array<{ id: ProjectFormTab; label: string }> = [
  { id: "summary", label: "Proje Özeti" },
  { id: "basic", label: "Temel Bilgiler" },
  { id: "categories", label: "Kategoriler" },
  { id: "regions", label: "Bölgeler" },
];

const INITIAL_FORM = {
  title: "",
  price: "",
  donationUrl: "",
  isVisible: true,
  ngoId: "",
  selectedRegionIds: [] as number[],
  selectedCategoryIds: [] as number[],
};

function arrayMoveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function mapProjectToSortableItem(
  project: ProjectListItem,
  editingProjectId: number | null,
  isDeletingId: number | null,
  handleEdit: (project: ProjectListItem) => void,
  handleDelete: (projectId: number) => void,
  withActions = true,
): SortableListItem {
  const secondaryCategoryNames = Array.from(
    new Set(
      project.categories
        .filter((category) => category.parent_id !== null)
        .map((category) => category.name),
    ),
  );
  const secondaryCategoryLabel = secondaryCategoryNames.length
    ? secondaryCategoryNames.join(", ")
    : "Yok";

  return {
    id: project.id,
    primary: project.title,
    status: (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${project.is_visible
            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}
        >
          {project.is_visible ? "Görünür" : "Gizli"}
        </span>
        {project.ngo?.is_visible === false ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            Kurum gizli
          </span>
        ) : null}
        {project.categories.length > 0 && !project.categories.some((category) => category.is_visible !== false) ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Bu projenin görünür kategorisi yok
          </span>
        ) : null}
        {project.regions.length > 0 && !project.regions.some((region) => region.is_visible !== false) ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Bu projenin görünür bölgesi yok
          </span>
        ) : null}
      </span>
    ),
    meta: `Kurum: ${project.ngo?.name ?? "Bilinmiyor"}`,
    secondary: `Kurum: ${project.ngo?.name ?? "Bilinmiyor"} · Bölge: ${project.regions.length ? project.regions.map((region) => region.name).join(", ") : "Belirtilmedi"
      } · Alt kategoriler: ${secondaryCategoryLabel} · Tutar: ${project.price ?? 0}`,
    link: project.donation_url,
    isHighlighted: editingProjectId === project.id,
    actions: withActions ? (
      <>
        <button
          type="button"
          onClick={() => handleEdit(project)}
          className="inline-flex h-11 items-center justify-center sm:h-9 rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => handleDelete(project.id)}
          className="inline-flex h-11 items-center justify-center sm:h-9 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          {isDeletingId === project.id ? "Siliniyor..." : "Sil"}
        </button>
      </>
    ) : undefined,
  };
}

export function ProjectPanel() {
  const supabase = createClient();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ngoFilter, setNgoFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [regionPickerQuery, setRegionPickerQuery] = useState("");
  const [activeFormTab, setActiveFormTab] = useState<ProjectFormTab>("summary");

  const [ngos, setNgos] = useState<NgoOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [originalItems, setOriginalItems] = useState<SortableListItem[]>([]);
  const [reorderedItems, setReorderedItems] = useState<SortableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderNgoFilter, setOrderNgoFilter] = useState("all");
  const [orderCategoryFilter, setOrderCategoryFilter] = useState("all");

  const [title, setTitle] = useState(INITIAL_FORM.title);
  const [price, setPrice] = useState(INITIAL_FORM.price);
  const [donationUrl, setDonationUrl] = useState(INITIAL_FORM.donationUrl);
  const [isVisible, setIsVisible] = useState(INITIAL_FORM.isVisible);
  const [ngoId, setNgoId] = useState(INITIAL_FORM.ngoId);
  const [selectedRegionIds, setSelectedRegionIds] = useState<number[]>(
    INITIAL_FORM.selectedRegionIds,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    INITIAL_FORM.selectedCategoryIds,
  );
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    price?: string;
    donationUrl?: string;
    ngoId?: string;
    categories?: string;
  }>({});
  const [initialFormState, setInitialFormState] = useState({
    ...INITIAL_FORM,
  });

  const isEditMode = editingProjectId !== null;
  const titleText = useMemo(
    () => (isEditMode ? "Proje Düzenle" : "Proje Oluştur"),
    [isEditMode],
  );
  const hasUnsavedOrder = useMemo(() => {
    if (originalItems.length !== reorderedItems.length) return true;
    return reorderedItems.some((item, index) => item.id !== originalItems[index]?.id);
  }, [originalItems, reorderedItems]);
  const filteredOrderItems = useMemo(() => {
    const query = orderSearchQuery.trim().toLocaleLowerCase("tr-TR");
    return reorderedItems.filter((item) => {
      const matchesQuery =
        !query ||
        `${item.primary} ${item.secondary ?? ""}`.toLocaleLowerCase("tr-TR").includes(query);
      const matchesNgo =
        orderNgoFilter === "all" ||
        (item.meta ?? "").toLocaleLowerCase("tr-TR").includes(orderNgoFilter.toLocaleLowerCase("tr-TR"));
      const matchesCategory =
        orderCategoryFilter === "all" ||
        (item.secondary ?? "").toLocaleLowerCase("tr-TR").includes(orderCategoryFilter.toLocaleLowerCase("tr-TR"));
      return matchesQuery && matchesNgo && matchesCategory;
    });
  }, [orderCategoryFilter, orderNgoFilter, orderSearchQuery, reorderedItems]);
  const globalOrderIndexById = useMemo(
    () =>
      reorderedItems.reduce<Record<number, number>>((acc, item, index) => {
        acc[item.id] = index;
        return acc;
      }, {}),
    [reorderedItems],
  );
  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    ngoFilter !== "all" ||
    categoryFilter !== "all" ||
    regionFilter !== "all";
  const hasFormChanges = useMemo(() => {
    const normalizeList = (values: number[]) => [...values].sort((a, b) => a - b).join(",");
    return (
      title.trim() !== initialFormState.title.trim() ||
      price.trim() !== initialFormState.price.trim() ||
      donationUrl.trim() !== initialFormState.donationUrl.trim() ||
      isVisible !== initialFormState.isVisible ||
      ngoId.trim() !== initialFormState.ngoId.trim() ||
      normalizeList(selectedRegionIds) !== normalizeList(initialFormState.selectedRegionIds) ||
      normalizeList(selectedCategoryIds) !== normalizeList(initialFormState.selectedCategoryIds)
    );
  }, [
    donationUrl,
    initialFormState,
    isVisible,
    ngoId,
    price,
    selectedCategoryIds,
    selectedRegionIds,
    title,
  ]);
  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);
  const primaryCategories = useMemo(() => getPrimaryCategories(sortedCategories), [sortedCategories]);
  const effectiveSelectedCategoryIds = useMemo(
    () => buildExpandedCategoryIds(sortedCategories, selectedCategoryIds),
    [selectedCategoryIds, sortedCategories],
  );
  const selectedCategoriesSummary = useMemo(
    () =>
      sortedCategories.filter((category) => effectiveSelectedCategoryIds.includes(category.id)),
    [effectiveSelectedCategoryIds, sortedCategories],
  );
  const selectedRegionsSummary = useMemo(
    () => regions.filter((region) => selectedRegionIds.includes(region.id)),
    [regions, selectedRegionIds],
  );
  const selectedNgoName = useMemo(
    () => ngos.find((ngo) => String(ngo.id) === ngoId)?.name ?? "Seçilmedi",
    [ngoId, ngos],
  );
  const regionPickerResults = useMemo(() => {
    const query = regionPickerQuery.trim().toLocaleLowerCase("tr-TR");
    const selected = new Set(selectedRegionIds);
    return regions
      .filter((region) => {
        const matchesQuery = !query || region.name.toLocaleLowerCase("tr-TR").includes(query);
        return matchesQuery && !selected.has(region.id);
      })
      .slice(0, 8);
  }, [regionPickerQuery, regions, selectedRegionIds]);
  const missingRequiredFields = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("Proje başlığı");
    if (!ngoId) missing.push("Kurum");
    if (!price.trim()) missing.push("Tutar");
    if (!donationUrl.trim()) missing.push("Bağış URL");
    if (selectedCategoriesSummary.length === 0) missing.push("Kategori");
    return missing;
  }, [donationUrl, ngoId, price, selectedCategoriesSummary.length, title]);

  const filteredReorderedItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");
    const projectById = new Map(projects.map((project) => [project.id, project]));
    return reorderedItems.filter((item) => {
      const project = projectById.get(item.id);
      if (!project) return false;
      const matchesQuery =
        !query ||
        project.title.toLocaleLowerCase("tr-TR").includes(query) ||
        (project.ngo?.name ?? "").toLocaleLowerCase("tr-TR").includes(query);
      const matchesNgo = ngoFilter === "all" || String(project.ngo_id) === ngoFilter;
      const matchesCategory =
        categoryFilter === "all" || project.categoryIds.includes(Number(categoryFilter));
      const matchesRegion =
        regionFilter === "all" || project.regions.some((region) => String(region.id) === regionFilter);
      return matchesQuery && matchesNgo && matchesCategory && matchesRegion;
    });
  }, [categoryFilter, ngoFilter, projects, regionFilter, reorderedItems, searchQuery]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [ngoRes, categoryRes, regionRes, projectRes] = await Promise.all([
        supabase
          .from("ngo")
          .select("id,name")
          .order("position", { ascending: true, nullsFirst: false }),
        supabase
          .from("category")
          .select("id,name,parent_id,level,position,slug,description,image_url,is_visible")
          .order("position", { ascending: true, nullsFirst: false }),
        supabase.from("bolge").select("id,name,is_visible").order("id"),
        (hasActiveFilter
          ? supabase
            .from("project")
            .select("id,title,price,donation_url,is_visible,ngo_id,position,ngo:ngo_id(name,is_visible),project_bolge(bolge:bolge_id(id,name,is_visible)),project_categories(category:category_id(id,name,slug,parent_id,level,position,is_visible))")
            .order("id", { ascending: false })
          : supabase
            .from("project")
            .select("id,title,price,donation_url,is_visible,ngo_id,position,ngo:ngo_id(name,is_visible),project_bolge(bolge:bolge_id(id,name,is_visible)),project_categories(category:category_id(id,name,slug,parent_id,level,position,is_visible))")
            .order("id", { ascending: false })),
      ]);

      if (ngoRes.error) throw ngoRes.error;
      if (categoryRes.error) throw categoryRes.error;
      if (regionRes.error) throw regionRes.error;
      if (projectRes.error) throw projectRes.error;

      setNgos((ngoRes.data ?? []) as NgoOption[]);
      setCategories(sortCategories((categoryRes.data ?? []) as CategoryOption[]));
      setRegions((regionRes.data ?? []) as RegionOption[]);
      const mappedProjects = ((projectRes.data ?? []) as ProjectRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        donation_url: row.donation_url,
        is_visible: row.is_visible ?? true,
        ngo_id: row.ngo_id,
        regions: Array.from(
          new Map(
            (row.project_bolge ?? [])
              .map((item) => {
                const bolge = Array.isArray(item.bolge) ? item.bolge[0] ?? null : item.bolge;
                return bolge ? [bolge.id, bolge] : null;
              })
              .filter(
                (item): item is [number, { id: number; name: string; is_visible: boolean | null }] =>
                  Boolean(item),
              ),
          ).values(),
        ),
        categoryIds: Array.from(
          new Set(
            (row.project_categories ?? [])
              .map((item) => {
                const category = Array.isArray(item.category)
                  ? item.category[0] ?? null
                  : item.category;
                return category?.id ?? null;
              })
              .filter((id): id is number => typeof id === "number"),
          ),
        ),
        categories: Array.from(
          new Map(
            (row.project_categories ?? [])
              .map((item) => (Array.isArray(item.category) ? item.category[0] ?? null : item.category))
              .filter(
                (
                  category,
                ): category is { id: number; name: string; parent_id: number | null; is_visible: boolean | null } =>
                  Boolean(category),
              )
              .map((category) => [category.id, category]),
          ).values(),
        ),
        position: row.position,
        ngo: Array.isArray(row.ngo) ? row.ngo[0] ?? null : row.ngo,
      }));
      setProjects(mappedProjects);

      const listItems = mappedProjects.map((project) =>
        mapProjectToSortableItem(
          project,
          editingProjectId,
          isDeletingId,
          handleEdit,
          handleDelete,
          true,
        ),
      );
      setOriginalItems(listItems);
      setReorderedItems(listItems);
    } catch (loadError) {
      console.error(loadError);
      setError("Proje paneli verileri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [editingProjectId, isDeletingId]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasFormChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasFormChanges]);

  function resetForm() {
    setTitle(INITIAL_FORM.title);
    setPrice(INITIAL_FORM.price);
    setDonationUrl(INITIAL_FORM.donationUrl);
    setIsVisible(INITIAL_FORM.isVisible);
    setNgoId(INITIAL_FORM.ngoId);
    setSelectedRegionIds(INITIAL_FORM.selectedRegionIds);
    setSelectedCategoryIds(INITIAL_FORM.selectedCategoryIds);
    setEditingProjectId(null);
    setFieldErrors({});
    setInitialFormState({ ...INITIAL_FORM });
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function togglePrimaryCategoryGroup(primaryId: number) {
    const descendants = getDescendantCategoryIds(sortedCategories, primaryId);
    const groupIds = new Set(descendants);
    const currentlySelected = effectiveSelectedCategoryIds.includes(primaryId);

    setSelectedCategoryIds((current) => {
      if (currentlySelected) {
        return current.filter((id) => !groupIds.has(id));
      }
      return Array.from(new Set([...current, primaryId]));
    });
  }

  function toggleRegion(id: number) {
    setSelectedRegionIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function validateDonationUrl(url: string) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleEdit(project: ProjectListItem) {
    if (hasFormChanges) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Düzenlemeye geçmek istiyor musunuz?",
      );
      if (!confirmed) return;
    }
    try {
      setMessage(null);
      setError(null);
      setFieldErrors({});
      setIsSaving(true);

      const { data, error: relationError } = await supabase
        .from("project_categories")
        .select("category_id")
        .eq("project_id", project.id);

      if (relationError) throw relationError;

      const { data: regionData, error: regionRelationError } = await supabase
        .from("project_bolge")
        .select("bolge_id")
        .eq("project_id", project.id);
      if (regionRelationError) throw regionRelationError;

      const categoryIds = Array.from(
        new Set(((data ?? []) as ProjectCategoryRow[]).map((item) => item.category_id)),
      );
      const regionIds = ((regionData ?? []) as ProjectBolgeRow[]).map((item) => item.bolge_id);

      setEditingProjectId(project.id);
      setTitle(project.title ?? "");
      setPrice(project.price !== null ? String(project.price) : "");
      setDonationUrl(project.donation_url ?? "");
      setIsVisible(project.is_visible);
      setNgoId(String(project.ngo_id));
      setSelectedRegionIds(Array.from(new Set(regionIds)));
      setSelectedCategoryIds(categoryIds);
      setInitialFormState({
        title: project.title ?? "",
        price: project.price !== null ? String(project.price) : "",
        donationUrl: project.donation_url ?? "",
        isVisible: project.is_visible,
        ngoId: String(project.ngo_id),
        selectedRegionIds: Array.from(new Set(regionIds)),
        selectedCategoryIds: categoryIds,
      });
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (editError) {
      console.error(editError);
      setError("Proje düzenleme verileri yüklenemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    if (hasFormChanges) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Düzenlemeyi iptal etmek istiyor musunuz?",
      );
      if (!confirmed) return;
    }
    resetForm();
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});

    const trimmedTitle = title.trim();
    const trimmedUrl = donationUrl.trim();
    const parsedPrice = Number(price);

    if (!trimmedTitle) {
      setFieldErrors({ title: "Proje başlığı zorunludur." });
      setError("Proje başlığı zorunludur.");
      return;
    }
    if (!isAllowedAdminText(trimmedTitle)) {
      setFieldErrors({ title: getAdminTextValidationMessage("Proje başlığı") });
      setError(getAdminTextValidationMessage("Proje başlığı"));
      return;
    }

    if (!ngoId) {
      setFieldErrors({ ngoId: "Lütfen bir kurum seçin." });
      setError("Lütfen bir kurum seçin.");
      return;
    }

    if (Number.isNaN(parsedPrice)) {
      setFieldErrors({ price: "Tutar geçerli bir sayı olmalıdır." });
      setError("Tutar geçerli bir sayı olmalıdır.");
      return;
    }

    if (!trimmedUrl) {
      setFieldErrors({ donationUrl: "Bağış URL'si zorunludur." });
      setError("Bağış URL'si zorunludur.");
      return;
    }

    if (!validateDonationUrl(trimmedUrl)) {
      setFieldErrors({ donationUrl: "Bağış URL'si geçerli bir bağlantı olmalıdır." });
      setError("Bağış URL'si geçerli bir bağlantı olmalıdır.");
      return;
    }

    if (selectedCategoryIds.length < 1) {
      setFieldErrors({ categories: "Lütfen en az 1 kategori seçin." });
      setError("Lütfen en az 1 kategori seçin.");
      return;
    }

    try {
      setIsSaving(true);

      const projectPayload = {
        ngo_id: Number(ngoId),
        title: trimmedTitle,
        price: parsedPrice,
        donation_url: trimmedUrl,
        is_visible: isVisible,
      };

      let projectId = editingProjectId;

      if (isEditMode && editingProjectId !== null) {
        const { error: updateError } = await supabase
          .from("project")
          .update(projectPayload)
          .eq("id", editingProjectId);
        if (updateError) throw updateError;

        const { error: deleteRelationsError } = await supabase
          .from("project_categories")
          .delete()
          .eq("project_id", editingProjectId);
        if (deleteRelationsError) throw deleteRelationsError;

        const { error: deleteProjectBolgeError } = await supabase
          .from("project_bolge")
          .delete()
          .eq("project_id", editingProjectId);
        if (deleteProjectBolgeError) throw deleteProjectBolgeError;
      } else {
        const maxPosition = projects.reduce((acc, item) => Math.max(acc, item.position ?? 0), 0);
        const { data: insertedProject, error: insertError } = await supabase
          .from("project")
          .insert({ ...projectPayload, position: maxPosition + 1 })
          .select("id")
          .single();

        if (insertError || !insertedProject) {
          throw insertError ?? new Error("Proje ekleme işlemi başarısız.");
        }
        projectId = insertedProject.id;
      }

      if (!projectId) {
        throw new Error("Proje kimliği bulunamadı.");
      }

      const finalCategoryIds = buildExpandedCategoryIds(sortedCategories, selectedCategoryIds);
      const junctionPayload = finalCategoryIds.map((categoryId) => ({
        project_id: projectId,
        category_id: categoryId,
      }));

      const { error: relationError } = await supabase
        .from("project_categories")
        .insert(junctionPayload);
      if (relationError) throw relationError;

      const uniqueRegionIds = Array.from(new Set(selectedRegionIds));
      if (uniqueRegionIds.length > 0) {
        const regionPayload = uniqueRegionIds.map((regionId) => ({
          project_id: projectId,
          bolge_id: regionId,
        }));
        const { error: regionInsertError } = await supabase
          .from("project_bolge")
          .insert(regionPayload);
        if (regionInsertError) throw regionInsertError;
      }

      setMessage(isEditMode ? "Proje güncellendi." : "Proje oluşturuldu.");
      setInitialFormState({ ...INITIAL_FORM });
      resetForm();
      await loadData();
    } catch (submitError) {
      console.error(submitError);
      setError(isEditMode ? "Proje güncellenemedi." : "Proje oluşturulamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(projectId: number) {
    if (hasFormChanges) {
      const proceed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Silme işlemine devam etmek istiyor musunuz?",
      );
      if (!proceed) return;
    }
    const confirmed = window.confirm("Bu projeyi silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      setMessage(null);
      setError(null);
      setIsDeletingId(projectId);

      const { error: deleteRelationsError } = await supabase
        .from("project_categories")
        .delete()
        .eq("project_id", projectId);
      if (deleteRelationsError) throw deleteRelationsError;

      const { error: deleteProjectBolgeError } = await supabase
        .from("project_bolge")
        .delete()
        .eq("project_id", projectId);
      if (deleteProjectBolgeError) throw deleteProjectBolgeError;

      const { error: deleteProjectError } = await supabase.from("project").delete().eq("id", projectId);
      if (deleteProjectError) throw deleteProjectError;

      if (editingProjectId === projectId) {
        resetForm();
      }

      setMessage("Proje silindi.");
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Proje silinemedi.");
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleSaveOrder() {
    if (!hasUnsavedOrder || hasActiveFilter) return;

    try {
      setIsSavingOrder(true);
      setMessage(null);
      setError(null);

      for (let index = 0; index < reorderedItems.length; index += 1) {
        const item = reorderedItems[index];
        const { error: updateError } = await supabase
          .from("project")
          .update({ position: index + 1 })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }

      setMessage("Proje sıralaması kaydedildi.");
      await loadData();
    } catch (saveOrderError) {
      console.error(saveOrderError);
      setError("Proje sıralaması kaydedilemedi.");
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleCancelOrder() {
    setReorderedItems(originalItems);
    setMessage(null);
    setError(null);
  }

  function applyFilteredOrder(nextFiltered: SortableListItem[]) {
    const filteredIds = new Set(nextFiltered.map((item) => item.id));
    const queue = [...nextFiltered];
    setReorderedItems((current) =>
      current.map((item) => (filteredIds.has(item.id) ? (queue.shift() ?? item) : item)),
    );
  }

  function moveOrderItemToGlobalIndex(itemId: number, targetIndex: number) {
    setReorderedItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === itemId);
      if (fromIndex === -1) return current;
      const clamped = Math.max(0, Math.min(current.length - 1, targetIndex));
      return arrayMoveItem(current, fromIndex, clamped);
    });
  }

  function closeOrderModal() {
    setIsOrderModalOpen(false);
    setOrderSearchQuery("");
    setOrderNgoFilter("all");
    setOrderCategoryFilter("all");
    void loadData();
  }

  async function openOrderModal() {
    try {
      setMessage(null);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("project")
        .select("id,title,price,donation_url,is_visible,ngo_id,position,ngo:ngo_id(name,is_visible),project_bolge(bolge:bolge_id(id,name,is_visible)),project_categories(category:category_id(id,name,slug,parent_id,level,is_visible))")
        .order("position", { ascending: true, nullsFirst: false });
      if (fetchError) throw fetchError;

      const mappedProjects = ((data ?? []) as ProjectRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        donation_url: row.donation_url,
        is_visible: row.is_visible ?? true,
        ngo_id: row.ngo_id,
        regions: Array.from(
          new Map(
            (row.project_bolge ?? [])
              .map((item) => {
                const bolge = Array.isArray(item.bolge) ? item.bolge[0] ?? null : item.bolge;
                return bolge ? [bolge.id, bolge] : null;
              })
              .filter(
                (item): item is [number, { id: number; name: string; is_visible: boolean | null }] =>
                  Boolean(item),
              ),
          ).values(),
        ),
        categoryIds: Array.from(
          new Set(
            (row.project_categories ?? [])
              .map((item) => {
                const category = Array.isArray(item.category) ? item.category[0] ?? null : item.category;
                return category?.id ?? null;
              })
              .filter((id): id is number => typeof id === "number"),
          ),
        ),
        categories: Array.from(
          new Map(
            (row.project_categories ?? [])
              .map((item) => (Array.isArray(item.category) ? item.category[0] ?? null : item.category))
              .filter(
                (
                  category,
                ): category is { id: number; name: string; parent_id: number | null; is_visible: boolean | null } =>
                  Boolean(category),
              )
              .map((category) => [category.id, category]),
          ).values(),
        ),
        position: row.position,
        ngo: Array.isArray(row.ngo) ? row.ngo[0] ?? null : row.ngo,
      }));

      const listItems = mappedProjects.map((project) =>
        mapProjectToSortableItem(
          project,
          editingProjectId,
          isDeletingId,
          handleEdit,
          handleDelete,
          false,
        ),
      );

      setOriginalItems(listItems);
      setReorderedItems(listItems);
      setIsOrderModalOpen(true);
    } catch (orderError) {
      console.error(orderError);
      setError("Sıralama listesi yüklenemedi.");
    }
  }

  return (
    <section className="space-y-6 md:space-y-8">
      <section
        ref={formSectionRef}
        className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 md:p-6"
      >
        <h2 className="text-xl font-semibold text-text-primary">
          {titleText}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode
            ? "Proje bilgilerini güncelleyip kategorileri yeniden bağlayın."
            : "Proje kaydı ekleyin ve kategorilerle ilişkilendirin."}
        </p>
        {hasFormChanges ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Kaydedilmemiş değişiklikler var.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-divider-softLight bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="border-b border-divider-softLight bg-surface-pageLight/70 px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto">
                {PROJECT_FORM_TABS.map((tab) => {
                  const isActive = activeFormTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormTab(tab.id)}
                      className={`relative min-h-11 shrink-0 rounded-t-xl px-4 text-sm font-semibold transition ${isActive
                        ? "bg-white text-brand-primary shadow-sm"
                        : "text-text-secondary hover:bg-white/70 hover:text-text-primary"
                        }`}
                    >
                      {tab.label}
                      {isActive ? (
                        <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-brand-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[420px] p-5">
              {activeFormTab === "summary" ? (
                <section className="rounded-2xl border border-divider-softLight bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      Proje Özeti
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      Yayına hazır olma durumu
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Seçimlerinizi ve görünürlük durumunu tek ekranda kontrol edin.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <dl className="rounded-2xl bg-surface-pageLight p-5">
                      <div className="border-b border-divider-softLight pb-4">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                          Proje Başlığı
                        </dt>

                        <dd className="mt-2 text-2xl font-bold leading-tight text-text-primary">
                          {title.trim() || "Henüz proje başlığı girilmedi"}
                        </dd>

                        {title.trim() ? (
                          <p className="mt-1 text-sm text-text-secondary">
                            Bu proje kullanıcı tarafında bu başlıkla görüntülenecek.
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-4 pt-5 sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                            Kurum
                          </dt>
                          <dd className="mt-1 text-base font-semibold text-text-primary">
                            {selectedNgoName}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                            Durum
                          </dt>
                          <dd
                            className={`mt-1 text-base font-semibold ${isVisible ? "text-green-700" : "text-slate-600"
                              }`}
                          >
                            {isVisible ? "Görünür" : "Gizli"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                            Kategoriler
                          </dt>
                          <dd className="mt-1 text-base font-semibold text-text-primary">
                            {selectedCategoriesSummary.length} seçili
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                            Bölgeler
                          </dt>
                          <dd className="mt-1 text-base font-semibold text-text-primary">
                            {selectedRegionsSummary.length
                              ? `${selectedRegionsSummary.length} seçili`
                              : "Bölgesiz"}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <section>
                        <h4 className="text-sm font-semibold text-text-primary">Seçilen Kategoriler</h4>
                        {selectedCategoriesSummary.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedCategoriesSummary.map((category) => (
                              <span
                                key={category.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary"
                              >
                                <span className="text-[10px] leading-none">✓</span>
                                {category.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-text-secondary">
                            Henüz kategori seçilmedi.
                          </p>
                        )}
                      </section>

                      <section>
                        <h4 className="text-sm font-semibold text-text-primary">Seçilen Bölgeler</h4>
                        {selectedRegionsSummary.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedRegionsSummary.map((region) => (
                              <span
                                key={region.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-text-primary"
                              >
                                <span className="text-[10px] leading-none">✓</span>
                                {region.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-text-secondary">
                            Bölge opsiyonel. Bu proje bölgesiz yayımlanabilir.
                          </p>
                        )}
                      </section>
                    </div>

                    <div className="grid gap-6 border-t border-divider-softLight pt-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Tamamlanma Durumu</h4>
                        <ul className="mt-3 space-y-2 text-sm leading-6">
                          <li className={title.trim() && ngoId && price.trim() && donationUrl.trim() ? "text-green-700" : "text-text-secondary"}>
                            {title.trim() && ngoId && price.trim() && donationUrl.trim() ? "✓" : "•"} Temel bilgiler {title.trim() && ngoId && price.trim() && donationUrl.trim() ? "tamamlandı" : "eksik"}
                          </li>
                          <li className={selectedCategoriesSummary.length ? "text-green-700" : "text-text-secondary"}>
                            {selectedCategoriesSummary.length ? "✓" : "•"} En az bir kategori {selectedCategoriesSummary.length ? "seçildi" : "eksik"}
                          </li>
                          <li className="text-text-secondary">• Bölge opsiyonel</li>
                        </ul>
                        {missingRequiredFields.length ? (
                          <p className="mt-3 text-xs font-medium text-text-secondary">
                            Eksik alanlar: {missingRequiredFields.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface-pageLight px-4 py-4">
                        <span>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                            Yayın Durumu
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-text-primary">
                            Proje kullanıcı tarafında görünsün
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-text-secondary">
                            Kapatıldığında bu proje yalnızca admin panelinde görünür.
                          </span>
                          <span className={`mt-2 inline-flex text-xs font-semibold ${isVisible ? "text-green-700" : "text-slate-600"}`}>
                            {isVisible ? "Görünür" : "Gizli"}
                          </span>
                        </span>
                        <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                          <input
                            type="checkbox"
                            role="switch"
                            checked={isVisible}
                            onChange={(event) => setIsVisible(event.target.checked)}
                            disabled={isSaving}
                            className="peer sr-only"
                          />
                          <span className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-brand-primary peer-focus-visible:ring-4 peer-focus-visible:ring-brand-primary/15 peer-disabled:opacity-60" />
                          <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                        </span>
                      </label>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeFormTab === "basic" ? (
                <section className="rounded-2xl border border-divider-softLight bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      1. Temel Bilgiler
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      Projenin ana bilgileri
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Adminlerin en sık doldurduğu alanlar burada, hızlı ve net.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor="project-title" className="mb-1.5 block text-sm font-semibold text-text-primary">
                        Proje Başlığı *
                      </label>
                      <input
                        id="project-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="h-12 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                        placeholder="Örn: Gazze acil yardım kampanyası"
                        disabled={isSaving}
                      />
                      {fieldErrors.title ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.title}</p> : null}
                    </div>

                    <div>
                      <label htmlFor="project-ngo" className="mb-1.5 block text-sm font-semibold text-text-primary">
                        Kurum *
                      </label>
                      <select
                        id="project-ngo"
                        value={ngoId}
                        onChange={(event) => setNgoId(event.target.value)}
                        className="h-12 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                        disabled={isSaving}
                      >
                        <option value="">Kurum seçin</option>
                        {ngos.map((ngo) => (
                          <option key={ngo.id} value={ngo.id}>
                            {ngo.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.ngoId ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.ngoId}</p> : null}
                    </div>

                    <div>
                      <label htmlFor="project-price" className="mb-1.5 block text-sm font-semibold text-text-primary">
                        Tutar *
                      </label>
                      <input
                        id="project-price"
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className="h-12 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                        placeholder="0"
                        disabled={isSaving}
                      />
                      {fieldErrors.price ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.price}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="project-url" className="mb-1.5 block text-sm font-semibold text-text-primary">
                        Bağış URL *
                      </label>
                      <input
                        id="project-url"
                        type="url"
                        value={donationUrl}
                        onChange={(event) => setDonationUrl(event.target.value)}
                        className="h-12 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                        placeholder="https://example.org/donate"
                        disabled={isSaving}
                      />
                      {fieldErrors.donationUrl ? (
                        <p className="mt-1.5 text-xs text-red-600">{fieldErrors.donationUrl}</p>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {activeFormTab === "categories" ? (
                <section className="rounded-2xl border border-divider-softLight bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      2. Kategoriler
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      Ana kategori seç, sonra detaylandır
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Alt kategoriler yalnızca ilgili ana kategori seçildiğinde görünür.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {primaryCategories.map((primary) => {
                      const children = getDirectChildren(sortedCategories, primary.id);
                      const primaryChecked = effectiveSelectedCategoryIds.includes(primary.id);
                      return (
                        <button
                          key={primary.id}
                          type="button"
                          onClick={() => togglePrimaryCategoryGroup(primary.id)}
                          disabled={isSaving}
                          className={`group flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 ${primaryChecked
                            ? "border-brand-primary/45 bg-brand-primary/10 ring-2 ring-brand-primary/10"
                            : "border-divider-softLight bg-surface-pageLight hover:border-brand-primary/25 hover:bg-white"
                            }`}
                        >
                          <span className="flex w-full items-start justify-between gap-3">
                            <span className="text-sm font-semibold text-text-primary">{primary.name}</span>
                            <span
                              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${primaryChecked
                                ? "bg-brand-primary text-white"
                                : "bg-white text-text-secondary ring-1 ring-divider-softLight group-hover:text-brand-primary"
                                }`}
                            >
                              {primaryChecked ? "✓" : "+"}
                            </span>
                          </span>
                          <span className="mt-3 text-xs text-text-secondary">
                            {children.length ? `${children.length} alt kategori` : "Alt kategori yok"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-3">
                    {primaryCategories.map((primary) => {
                      const children = getDirectChildren(sortedCategories, primary.id);
                      const primaryChecked = effectiveSelectedCategoryIds.includes(primary.id);
                      if (!primaryChecked || children.length === 0) return null;
                      return (
                        <div key={primary.id} className="rounded-2xl border border-divider-softLight bg-surface-pageLight/70 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">
                              ✓
                            </span>
                            {primary.name}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {children.map((child) => {
                              const childChecked = selectedCategoryIds.includes(child.id);
                              return (
                                <label
                                  key={child.id}
                                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${childChecked
                                    ? "border-brand-primary/35 bg-white text-text-primary ring-2 ring-brand-primary/10"
                                    : "border-transparent bg-white/70 text-text-secondary hover:bg-white"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={childChecked}
                                    onChange={() => toggleCategory(child.id)}
                                    disabled={isSaving}
                                    className="h-4 w-4 rounded border-divider-softLight text-brand-primary focus:ring-brand-primary"
                                  />
                                  {child.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-divider-softLight bg-surface-pageLight p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                      Seçilen Kategoriler
                    </p>
                    {selectedCategoriesSummary.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedCategoriesSummary.map((category) => (
                          <span
                            key={category.id}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary"
                          >
                            ✓ {category.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-text-secondary">Henüz kategori seçilmedi.</p>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-text-secondary">
                    Alt kategori seçildiğinde üst kategorileri kayıt sırasında otomatik eklenir.
                  </p>
                  {fieldErrors.categories ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.categories}</p> : null}
                </section>
              ) : null}

              {activeFormTab === "regions" ? (
                <section className="rounded-2xl border border-divider-softLight bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      3. Bölgeler
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      Bölge kapsamı ekle
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Bölge opsiyoneldir. Arayarak birden fazla bölge seçebilirsiniz.
                    </p>
                  </div>

                  <label htmlFor="project-region-search" className="mb-1.5 block text-sm font-semibold text-text-primary">
                    Bölge Ara...
                  </label>
                  <input
                    id="project-region-search"
                    type="search"
                    value={regionPickerQuery}
                    onChange={(event) => setRegionPickerQuery(event.target.value)}
                    placeholder="Gazze, Sudan, Türkiye..."
                    className="h-12 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                    disabled={isSaving}
                  />

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                      Seçilen Bölgeler
                    </p>
                    {selectedRegionsSummary.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedRegionsSummary.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => toggleRegion(region.id)}
                            disabled={isSaving}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/15 disabled:opacity-70"
                            aria-label={`${region.name} bölgesini kaldır`}
                          >
                            ✓ {region.name}
                            <span className="text-sm leading-none">×</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-text-secondary">Bölge seçilmedi. Bu proje bölgesiz yayımlanabilir.</p>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-divider-softLight bg-surface-pageLight p-2">
                    {regionPickerResults.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {regionPickerResults.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => toggleRegion(region.id)}
                            disabled={isSaving}
                            className="flex min-h-11 items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:bg-brand-primary/5 disabled:opacity-70"
                          >
                            <span>{region.name}</span>
                            <span className="text-xs font-semibold text-brand-primary">Ekle</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-4 text-sm text-text-secondary">
                        Eşleşen veya eklenebilir bölge bulunamadı.
                      </p>
                    )}
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex flex-col gap-2 border-t border-divider-softLight bg-surface-pageLight/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:bg-white sm:px-4 sm:shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-70 sm:h-10 sm:w-auto"
            >
              {isSaving
                ? isEditMode
                  ? "Güncelleniyor..."
                  : "Kaydediliyor..."
                : isEditMode
                  ? "Projeyi Güncelle"
                  : "Proje Ekle"}
            </button>

            {isEditMode ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight disabled:opacity-70 sm:h-10 sm:w-auto"
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Mevcut Projeler
          </h3>
          <button
            type="button"
            onClick={openOrderModal}
            className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
          >
            Sıralamayı Düzenle
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Ara</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Proje veya kurum..."
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Kurum</span>
            <select
              value={ngoFilter}
              onChange={(event) => setNgoFilter(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            >
              <option value="all">Tümü</option>
              {ngos.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Kategori</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            >
              <option value="all">Tümü</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Bölge</span>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            >
              <option value="all">Tümü</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Projeler yükleniyor...</p>
        ) : filteredReorderedItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz proje bulunmuyor.</p>
        ) : (
          <>
            <div className="mt-4">
              <SortableOrderList
                items={hasActiveFilter ? filteredReorderedItems : reorderedItems}
                enableDrag={false}
                showIndexBadge={false}
                onReorder={(items) => {
                  if (hasActiveFilter) return;
                  setReorderedItems(items);
                }}
              />
            </div>
          </>
        )}
      </section>

      {isOrderModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-divider-softLight bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider-softLight px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">Proje Sıralamasını Düzenle</h3>
              <button
                type="button"
                onClick={closeOrderModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mb-3 grid gap-2 md:grid-cols-3">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(event) => setOrderSearchQuery(event.target.value)}
                  placeholder="Proje ara..."
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                />
                <select
                  value={orderNgoFilter}
                  onChange={(event) => setOrderNgoFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="all">Tüm kurumlar</option>
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.name}>
                      {ngo.name}
                    </option>
                  ))}
                </select>
                <select
                  value={orderCategoryFilter}
                  onChange={(event) => setOrderCategoryFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="all">Tüm kategoriler</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <SortableOrderList
                items={filteredOrderItems}
                showQuickMove
                totalItemsCount={reorderedItems.length}
                onMoveToGlobalIndex={moveOrderItemToGlobalIndex}
                globalIndexById={globalOrderIndexById}
                onReorder={applyFilteredOrder}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-divider-softLight px-4 py-3">
              <button
                type="button"
                onClick={closeOrderModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveOrder();
                  setIsOrderModalOpen(false);
                }}
                disabled={!hasUnsavedOrder || isSavingOrder}
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingOrder ? "Kaydediliyor..." : "Sıralamayı Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
