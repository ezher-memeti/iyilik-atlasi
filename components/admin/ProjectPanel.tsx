"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";

type NgoOption = { id: number; name: string };
type CategoryOption = { id: number; name: string };
type RegionOption = { id: number; name: string };
type ProjectCategoryRow = { category_id: number };
type ProjectListItem = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo_id: number;
  bolge_id: number | null;
  bolge: { id: number; name: string } | null;
  ngo: { name: string } | null;
  position: number | null;
};

type ProjectRow = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo_id: number;
  bolge_id: number | null;
  bolge: { id: number; name: string } | { id: number; name: string }[] | null;
  position: number | null;
  ngo: { name: string } | { name: string }[] | null;
};

const INITIAL_FORM = {
  title: "",
  price: "",
  donationUrl: "",
  ngoId: "",
  bolgeId: "",
  selectedCategoryIds: [] as number[],
};

export function ProjectPanel() {
  const supabase = createClient();
  const hasActiveFilter = false;

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
  const [bolgeId, setBolgeId] = useState(INITIAL_FORM.bolgeId);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    INITIAL_FORM.selectedCategoryIds,
  );
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = editingProjectId !== null;
  const titleText = useMemo(
    () => (isEditMode ? "Proje Düzenle" : "Proje Oluştur"),
    [isEditMode],
  );
  const hasUnsavedOrder = useMemo(() => {
    if (originalItems.length !== reorderedItems.length) return true;
    return reorderedItems.some((item, index) => item.id !== originalItems[index]?.id);
  }, [originalItems, reorderedItems]);

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
              .select("id,title,price,donation_url,ngo_id,bolge_id,position,ngo:ngo_id(name),bolge:bolge_id(id,name)")
              .order("id", { ascending: true })
          : supabase
              .from("project")
              .select("id,title,price,donation_url,ngo_id,bolge_id,position,ngo:ngo_id(name),bolge:bolge_id(id,name)")
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
        bolge_id: row.bolge_id,
        bolge: Array.isArray(row.bolge) ? row.bolge[0] ?? null : row.bolge,
        position: row.position,
        ngo: Array.isArray(row.ngo) ? row.ngo[0] ?? null : row.ngo,
      }));
      setProjects(mappedProjects);

      const listItems = mappedProjects.map((project) => ({
        id: project.id,
        primary: project.title,
        secondary: `Kurum: ${project.ngo?.name ?? "Bilinmiyor"} · Bölge: ${project.bolge?.name ?? "Belirtilmedi"} · Tutar: ${project.price ?? 0}`,
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

  function resetForm() {
    setTitle(INITIAL_FORM.title);
    setPrice(INITIAL_FORM.price);
    setDonationUrl(INITIAL_FORM.donationUrl);
    setNgoId(INITIAL_FORM.ngoId);
    setBolgeId(INITIAL_FORM.bolgeId);
    setSelectedCategoryIds(INITIAL_FORM.selectedCategoryIds);
    setEditingProjectId(null);
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((current) =>
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
    try {
      setMessage(null);
      setError(null);
      setIsSaving(true);

      const { data, error: relationError } = await supabase
        .from("project_categories")
        .select("category_id")
        .eq("project_id", project.id);

      if (relationError) throw relationError;

      const categoryIds = ((data ?? []) as ProjectCategoryRow[]).map((item) => item.category_id);

      setEditingProjectId(project.id);
      setTitle(project.title ?? "");
      setPrice(project.price !== null ? String(project.price) : "");
      setDonationUrl(project.donation_url ?? "");
      setNgoId(String(project.ngo_id));
      setBolgeId(project.bolge_id ? String(project.bolge_id) : "");
      setSelectedCategoryIds(categoryIds);
    } catch (editError) {
      console.error(editError);
      setError("Proje düzenleme verileri yüklenemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    resetForm();
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedUrl = donationUrl.trim();
    const parsedPrice = Number(price);

    if (!trimmedTitle) {
      setError("Proje başlığı zorunludur.");
      return;
    }

    if (!ngoId) {
      setError("Lütfen bir kurum seçin.");
      return;
    }

    if (Number.isNaN(parsedPrice)) {
      setError("Tutar geçerli bir sayı olmalıdır.");
      return;
    }

    if (!trimmedUrl) {
      setError("Bağış URL'si zorunludur.");
      return;
    }

    if (!validateDonationUrl(trimmedUrl)) {
      setError("Bağış URL'si geçerli bir bağlantı olmalıdır.");
      return;
    }

    if (selectedCategoryIds.length < 1) {
      setError("Lütfen en az 1 kategori seçin.");
      return;
    }

    try {
      setIsSaving(true);

      const projectPayload = {
        ngo_id: Number(ngoId),
        bolge_id: bolgeId ? Number(bolgeId) : null,
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

      setMessage(isEditMode ? "Proje güncellendi." : "Proje oluşturuldu.");
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
      <section className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 md:p-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {titleText}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode
            ? "Proje bilgilerini güncelleyip kategorileri yeniden bağlayın."
            : "Proje kaydı ekleyin ve kategorilerle ilişkilendirin."}
        </p>

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
          </div>

          <div>
            <label htmlFor="project-bolge" className="mb-1 block text-sm font-medium">
              Bölge
            </label>
            <select
              id="project-bolge"
              value={bolgeId}
              onChange={(event) => setBolgeId(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
              disabled={isSaving}
            >
              <option value="">Bölge seçin</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

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

        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Projeler yükleniyor...</p>
        ) : reorderedItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz proje bulunmuyor.</p>
        ) : (
          <>
            <div className="mt-4">
              <SortableOrderList items={reorderedItems} onReorder={setReorderedItems} />
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
