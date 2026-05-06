"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";

type CategoryItem = {
  id: number;
  name: string;
  description: string | null;
  position: number | null;
};

const INITIAL_NAME = "";
const INITIAL_DESCRIPTION = "";

export function CategoryPanel() {
  const supabase = createClient();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState(INITIAL_NAME);
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [originalItems, setOriginalItems] = useState<SortableListItem[]>([]);
  const [reorderedItems, setReorderedItems] = useState<SortableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [initialFormState, setInitialFormState] = useState({
    name: INITIAL_NAME,
    description: INITIAL_DESCRIPTION,
  });

  const isEditMode = editingCategoryId !== null;
  const title = useMemo(
    () => (isEditMode ? "Kategori Düzenle" : "Kategori Oluştur"),
    [isEditMode],
  );

  const hasUnsavedOrder = useMemo(() => {
    if (originalItems.length !== reorderedItems.length) return true;
    return reorderedItems.some((item, index) => item.id !== originalItems[index]?.id);
  }, [originalItems, reorderedItems]);
  const hasActiveFilter = searchQuery.trim().length > 0;
  const hasFormChanges = useMemo(
    () =>
      name.trim() !== initialFormState.name.trim() ||
      description.trim() !== initialFormState.description.trim(),
    [description, initialFormState.description, initialFormState.name, name],
  );

  async function loadCategories() {
    try {
      setIsLoading(true);
      setError(null);
      let query = supabase.from("category").select("id,name,description,position");
      query = hasActiveFilter
        ? query.order("id", { ascending: true })
        : query.order("position", { ascending: true, nullsFirst: false });
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      const next = (data ?? []) as CategoryItem[];
      setCategories(next);
      const listItems = next.map((category) => ({
        id: category.id,
        primary: category.name,
        secondary: category.description?.trim() || "Açıklama belirtilmedi.",
        isHighlighted: editingCategoryId === category.id,
        actions: (
          <>
            <button
              type="button"
              onClick={() => handleEdit(category)}
              className="inline-flex h-11 items-center justify-center sm:h-9 rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              className="inline-flex h-11 items-center justify-center sm:h-9 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              {isDeletingId === category.id ? "Siliniyor..." : "Sil"}
            </button>
          </>
        ),
      }));

      setOriginalItems(listItems);
      setReorderedItems(listItems);
    } catch (loadError) {
      console.error(loadError);
      setError("Kategoriler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [editingCategoryId, isDeletingId]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasFormChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasFormChanges]);

  const filteredReorderedItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (!query) return reorderedItems;

    const categoryById = new Map(categories.map((category) => [category.id, category]));
    return reorderedItems.filter((item) => {
      const category = categoryById.get(item.id);
      if (!category) return false;
      return (
        category.name.toLocaleLowerCase("tr-TR").includes(query) ||
        (category.description ?? "").toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [categories, reorderedItems, searchQuery]);

  function resetForm() {
    setName(INITIAL_NAME);
    setDescription(INITIAL_DESCRIPTION);
    setEditingCategoryId(null);
    setFieldErrors({});
    setInitialFormState({
      name: INITIAL_NAME,
      description: INITIAL_DESCRIPTION,
    });
  }

  function handleEdit(category: CategoryItem) {
    if (hasFormChanges) {
      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Düzenlemeye geçmek istiyor musunuz?",
      );
      if (!confirmed) return;
    }
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setEditingCategoryId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setInitialFormState({
      name: category.name ?? "",
      description: category.description ?? "",
    });
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

    const trimmed = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmed) {
      setFieldErrors({ name: "Kategori adı zorunludur." });
      setError("Kategori adı zorunludur.");
      return;
    }
    if (!isAllowedAdminText(trimmed)) {
      setFieldErrors({ name: getAdminTextValidationMessage("Kategori adı") });
      setError(getAdminTextValidationMessage("Kategori adı"));
      return;
    }
    if (trimmedDescription && !isAllowedAdminText(trimmedDescription)) {
      setFieldErrors({ description: getAdminTextValidationMessage("Kategori açıklaması") });
      setError(getAdminTextValidationMessage("Kategori açıklaması"));
      return;
    }
    if (trimmedDescription.length > 200) {
      setFieldErrors({ description: "Kategori açıklaması en fazla 200 karakter olabilir." });
      setError("Kategori açıklaması en fazla 200 karakter olabilir.");
      return;
    }

    try {
      setIsSaving(true);

      if (isEditMode && editingCategoryId !== null) {
        const { error: updateError } = await supabase
          .from("category")
          .update({
            name: trimmed,
            description: trimmedDescription || null,
          })
          .eq("id", editingCategoryId);
        if (updateError) throw updateError;
        setMessage("Kategori güncellendi.");
      } else {
        const maxPosition = categories.reduce((acc, item) => Math.max(acc, item.position ?? 0), 0);
        const { error: insertError } = await supabase.from("category").insert({
          name: trimmed,
          description: trimmedDescription || null,
          position: maxPosition + 1,
        });
        if (insertError) throw insertError;
        setMessage("Kategori oluşturuldu.");
      }

      setInitialFormState({
        name: INITIAL_NAME,
        description: INITIAL_DESCRIPTION,
      });
      resetForm();
      await loadCategories();
    } catch (submitError) {
      console.error(submitError);
      setError(isEditMode ? "Kategori güncellenemedi." : "Kategori oluşturulamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (hasFormChanges) {
      const proceed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Silme işlemine devam etmek istiyor musunuz?",
      );
      if (!proceed) return;
    }
    const confirmed = window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      setMessage(null);
      setError(null);
      setIsDeletingId(id);
      const { error: deleteError } = await supabase.from("category").delete().eq("id", id);
      if (deleteError) throw deleteError;

      if (editingCategoryId === id) {
        resetForm();
      }

      setMessage("Kategori silindi.");
      await loadCategories();
    } catch (deleteActionError) {
      console.error(deleteActionError);
      setError("Kategori silinemedi.");
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
          .from("category")
          .update({ position: index + 1 })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }

      setMessage("Kategori sıralaması kaydedildi.");
      await loadCategories();
    } catch (saveOrderError) {
      console.error(saveOrderError);
      setError("Kategori sıralaması kaydedilemedi.");
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
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode
            ? "Kategori adını güncelleyip değişiklikleri kaydedin."
            : "Yeni bir kategori ekleyin."}
        </p>
        {hasFormChanges ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Kaydedilmemiş değişiklikler var.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="category-name" className="mb-1 block text-sm font-medium">
              Ad *
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
              placeholder="Kategori adı"
              disabled={isSaving}
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="category-description" className="mb-1 block text-sm font-medium">
              Açıklama
            </label>
            <textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              className="min-h-24 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 py-2 text-sm outline-none focus:border-brand-primary"
              placeholder="Kategori açıklaması (maks. 200 karakter)"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-text-secondary">{description.length}/200</p>
            {fieldErrors.description ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-divider-softLight bg-surface-pageLight px-4 py-3 sm:mx-0 sm:flex-row sm:items-center sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-70 sm:h-10 sm:w-auto"
            >
              {isSaving
                ? isEditMode
                  ? "Güncelleniyor..."
                  : "Kaydediliyor..."
                : isEditMode
                  ? "Kategoriyi Güncelle"
                  : "Kategori Ekle"}
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
            Mevcut Kategoriler
          </h3>
          {hasUnsavedOrder ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Kaydedilmemiş sıralama değişikliği var
            </span>
          ) : null}
        </div>
        <div className="mt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Ara</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Kategori adı veya açıklaması..."
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Kategoriler yükleniyor...</p>
        ) : filteredReorderedItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz kategori bulunmuyor.</p>
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
