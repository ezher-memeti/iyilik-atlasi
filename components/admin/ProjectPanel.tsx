"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";

type NgoOption = { id: number; name: string };
type CategoryOption = { id: number; name: string };
type RegionOption = { id: number; name: string };
type ProjectCategoryRow = { category_id: number };
type ProjectBolgeRow = { bolge_id: number };
type ProjectListItem = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo_id: number;
  regions: Array<{ id: number; name: string }>;
  ngo: { name: string } | null;
  position: number | null;
};

type ProjectRow = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo_id: number;
  project_bolge:
    | Array<{
        bolge: { id: number; name: string } | { id: number; name: string }[] | null;
      }>
    | null;
  position: number | null;
  ngo: { name: string } | { name: string }[] | null;
};

const INITIAL_FORM = {
  title: "",
  price: "",
  donationUrl: "",
  ngoId: "",
  selectedRegionIds: [] as number[],
  selectedCategoryIds: [] as number[],
};

export function ProjectPanel() {
  const supabase = createClient();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ngoFilter, setNgoFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

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

  const [title, setTitle] = useState(INITIAL_FORM.title);
  const [price, setPrice] = useState(INITIAL_FORM.price);
  const [donationUrl, setDonationUrl] = useState(INITIAL_FORM.donationUrl);
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
  const hasActiveFilter =
    searchQuery.trim().length > 0 || ngoFilter !== "all" || regionFilter !== "all";
  const hasFormChanges = useMemo(() => {
    const normalizeList = (values: number[]) => [...values].sort((a, b) => a - b).join(",");
    return (
      title.trim() !== initialFormState.title.trim() ||
      price.trim() !== initialFormState.price.trim() ||
      donationUrl.trim() !== initialFormState.donationUrl.trim() ||
      ngoId.trim() !== initialFormState.ngoId.trim() ||
      normalizeList(selectedRegionIds) !== normalizeList(initialFormState.selectedRegionIds) ||
      normalizeList(selectedCategoryIds) !== normalizeList(initialFormState.selectedCategoryIds)
    );
  }, [
    donationUrl,
    initialFormState,
    ngoId,
    price,
    selectedCategoryIds,
    selectedRegionIds,
    title,
  ]);

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
      const matchesRegion =
        regionFilter === "all" || project.regions.some((region) => String(region.id) === regionFilter);
      return matchesQuery && matchesNgo && matchesRegion;
    });
  }, [ngoFilter, projects, regionFilter, reorderedItems, searchQuery]);

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
          .select("id,name")
          .order("position", { ascending: true, nullsFirst: false }),
        supabase.from("bolge").select("id,name").order("id"),
        (hasActiveFilter
          ? supabase
              .from("project")
              .select("id,title,price,donation_url,ngo_id,position,ngo:ngo_id(name),project_bolge(bolge:bolge_id(id,name))")
              .order("id", { ascending: true })
          : supabase
              .from("project")
              .select("id,title,price,donation_url,ngo_id,position,ngo:ngo_id(name),project_bolge(bolge:bolge_id(id,name))")
              .order("position", { ascending: true, nullsFirst: false })),
      ]);

      if (ngoRes.error) throw ngoRes.error;
      if (categoryRes.error) throw categoryRes.error;
      if (regionRes.error) throw regionRes.error;
      if (projectRes.error) throw projectRes.error;

      setNgos((ngoRes.data ?? []) as NgoOption[]);
      setCategories((categoryRes.data ?? []) as CategoryOption[]);
      setRegions((regionRes.data ?? []) as RegionOption[]);
      const mappedProjects = ((projectRes.data ?? []) as ProjectRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        donation_url: row.donation_url,
        ngo_id: row.ngo_id,
        regions: Array.from(
          new Map(
            (row.project_bolge ?? [])
              .map((item) => {
                const bolge = Array.isArray(item.bolge) ? item.bolge[0] ?? null : item.bolge;
                return bolge ? [bolge.id, bolge] : null;
              })
              .filter((item): item is [number, { id: number; name: string }] => Boolean(item)),
          ).values(),
        ),
        position: row.position,
        ngo: Array.isArray(row.ngo) ? row.ngo[0] ?? null : row.ngo,
      }));
      setProjects(mappedProjects);

      const listItems = mappedProjects.map((project) => ({
        id: project.id,
        primary: project.title,
        secondary: `Kurum: ${project.ngo?.name ?? "Bilinmiyor"} · Bölge: ${
          project.regions.length
            ? project.regions.map((region) => region.name).join(", ")
            : "Belirtilmedi"
        } · Tutar: ${project.price ?? 0}`,
        link: project.donation_url,
        isHighlighted: editingProjectId === project.id,
        actions: (
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
        ),
      }));
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

      const categoryIds = ((data ?? []) as ProjectCategoryRow[]).map((item) => item.category_id);
      const regionIds = ((regionData ?? []) as ProjectBolgeRow[]).map((item) => item.bolge_id);

      setEditingProjectId(project.id);
      setTitle(project.title ?? "");
      setPrice(project.price !== null ? String(project.price) : "");
      setDonationUrl(project.donation_url ?? "");
      setNgoId(String(project.ngo_id));
      setSelectedRegionIds(Array.from(new Set(regionIds)));
      setSelectedCategoryIds(categoryIds);
      setInitialFormState({
        title: project.title ?? "",
        price: project.price !== null ? String(project.price) : "",
        donationUrl: project.donation_url ?? "",
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

      const junctionPayload = selectedCategoryIds.map((categoryId) => ({
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="project-title" className="mb-1 block text-sm font-medium">
                Başlık *
              </label>
              <input
                id="project-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                placeholder="Proje başlığı"
                disabled={isSaving}
              />
              {fieldErrors.title ? <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p> : null}
            </div>

            <div>
              <label htmlFor="project-price" className="mb-1 block text-sm font-medium">
                Tutar *
              </label>
              <input
                id="project-price"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                placeholder="0"
                disabled={isSaving}
              />
              {fieldErrors.price ? <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="project-url" className="mb-1 block text-sm font-medium">
              Bağış URL *
            </label>
            <input
              id="project-url"
              type="url"
              value={donationUrl}
              onChange={(event) => setDonationUrl(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
              placeholder="https://example.org/donate"
              disabled={isSaving}
            />
            {fieldErrors.donationUrl ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.donationUrl}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="project-ngo" className="mb-1 block text-sm font-medium">
              Kurum *
            </label>
            <select
              id="project-ngo"
              value={ngoId}
              onChange={(event) => setNgoId(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
              disabled={isSaving}
            >
              <option value="">Kurum seçin</option>
              {ngos.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name}
                </option>
              ))}
            </select>
            {fieldErrors.ngoId ? <p className="mt-1 text-xs text-red-600">{fieldErrors.ngoId}</p> : null}
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Bölgeler</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {regions.map((region) => (
                <label
                  key={region.id}
                  className="inline-flex items-center gap-2 rounded-md border border-divider-softLight bg-surface-pageLight px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegionIds.includes(region.id)}
                    onChange={() => toggleRegion(region.id)}
                    disabled={isSaving}
                  />
                  {region.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Kategoriler * (en az 1)</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="inline-flex items-center gap-2 rounded-md border border-divider-softLight bg-surface-pageLight px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    disabled={isSaving}
                  />
                  {category.name}
                </label>
              ))}
            </div>
            {fieldErrors.categories ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.categories}</p>
            ) : null}
          </fieldset>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-divider-softLight bg-surface-pageLight px-4 py-3 sm:mx-0 sm:flex-row sm:items-center sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
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
          {hasUnsavedOrder ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Kaydedilmemiş sıralama değişikliği var
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
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
                onReorder={(items) => {
                  if (hasActiveFilter) return;
                  setReorderedItems(items);
                }}
              />
            </div>
            <div className="sticky bottom-0 z-10 mt-4 -mx-4 flex gap-2 border-t border-divider-softLight bg-surface-pageLight px-4 py-3 sm:mx-0 sm:justify-end sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={!hasUnsavedOrder || isSavingOrder}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary disabled:opacity-60 sm:h-10 sm:flex-none"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={!hasUnsavedOrder || isSavingOrder || hasActiveFilter}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60 sm:h-10 sm:flex-none"
              >
                {isSavingOrder ? "Sıra kaydediliyor..." : "Sıralamayı Kaydet"}
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
