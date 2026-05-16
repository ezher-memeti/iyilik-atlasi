"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";
import {
  getDescendantCategoryIds,
  getDirectChildren,
  getPrimaryCategories,
  sortCategories,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

type CategoryItem = FlatCategory;

type ToastItem = {
  id: number;
  title: string;
  tone: "success" | "error" | "info";
};

const INITIAL_NAME = "";
const INITIAL_DESCRIPTION = "";
const CATEGORY_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_CATEGORY_BUCKET ?? "category-images";

function arrayMoveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function normalizeForFileName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

export function CategoryPanel() {
  const supabase = createClient();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState(INITIAL_NAME);
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [originalItems, setOriginalItems] = useState<SortableListItem[]>([]);
  const [reorderedItems, setReorderedItems] = useState<SortableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string; parent?: string }>({});
  const [initialFormState, setInitialFormState] = useState({
    name: INITIAL_NAME,
    description: INITIAL_DESCRIPTION,
    imageUrl: "",
    parentCategoryId: "",
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
  const filteredOrderItems = useMemo(() => {
    const query = orderSearchQuery.trim().toLocaleLowerCase("tr-TR");
    if (!query) return reorderedItems;
    return reorderedItems.filter((item) =>
      `${item.primary} ${item.secondary ?? ""}`.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [orderSearchQuery, reorderedItems]);
  const globalOrderIndexById = useMemo(
    () =>
      reorderedItems.reduce<Record<number, number>>((acc, item, index) => {
        acc[item.id] = index;
        return acc;
      }, {}),
    [reorderedItems],
  );
  const hasActiveFilter = searchQuery.trim().length > 0;
  const hasFormChanges = useMemo(
    () =>
      name.trim() !== initialFormState.name.trim() ||
      description.trim() !== initialFormState.description.trim() ||
      (imageUrl ?? "") !== initialFormState.imageUrl ||
      parentCategoryId !== initialFormState.parentCategoryId ||
      Boolean(selectedImageFile),
    [
      description,
      imageUrl,
      initialFormState.description,
      initialFormState.imageUrl,
      initialFormState.name,
      initialFormState.parentCategoryId,
      name,
      parentCategoryId,
      selectedImageFile,
    ],
  );
  const primaryCategoryOptions = useMemo(
    () => getPrimaryCategories(categories).filter((category) => category.id !== editingCategoryId),
    [categories, editingCategoryId],
  );
  const hierarchyOrderedCategories = useMemo(() => {
    const orderIndexById = new Map(reorderedItems.map((item, index) => [item.id, index]));
    return [...categories].sort((a, b) => {
      const indexA = orderIndexById.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = orderIndexById.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
  }, [categories, reorderedItems]);

  const displayedPreviewUrl = imagePreviewUrl ?? imageUrl;

  function showToast(title: string, tone: ToastItem["tone"]) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  }

  function mapToSortableItems(next: CategoryItem[], withActions = true) {
    return next.map((category) => ({
      id: category.id,
      primary: category.name,
      secondary: category.description?.trim() || "Açıklama belirtilmedi.",
      meta: category.image_url ? "Görsel eklendi" : "Görsel yok",
      isHighlighted: editingCategoryId === category.id,
      actions: withActions ? (
        <>
          <button
            type="button"
            onClick={() => handleEdit(category)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight sm:h-10"
          >
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => handleDelete(category.id)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:h-10"
          >
            {isDeletingId === category.id ? "Siliniyor..." : "Sil"}
          </button>
        </>
      ) : undefined,
    }));
  }

  async function loadCategories() {
    try {
      setIsLoading(true);
      setError(null);
      let query = supabase
        .from("category")
        .select("id,name,slug,description,image_url,parent_id,level,position");
      query = query.order("position", { ascending: true, nullsFirst: false });
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      const next = sortCategories((data ?? []) as CategoryItem[]);
      setCategories(next);
      const listItems = mapToSortableItems(next);
      setOriginalItems(listItems);
      setReorderedItems(listItems);
    } catch (loadError) {
      console.error(loadError);
      setError("Kategoriler yüklenemedi.");
      showToast("Kategoriler yüklenemedi", "error");
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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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
  const visibleCategoryIds = useMemo(
    () => new Set(filteredReorderedItems.map((item) => item.id)),
    [filteredReorderedItems],
  );

  function categoryActionButtons(category: CategoryItem) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleEdit(category)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-divider-softLight bg-surface-pageLight px-3 text-xs font-semibold text-text-primary transition hover:bg-surface-categoryLight"
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => handleDelete(category.id)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          {isDeletingId === category.id ? "Siliniyor..." : "Sil"}
        </button>
      </div>
    );
  }

  function resetPreview() {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setSelectedImageFile(null);
    setUploadError(null);
  }

  function resetForm() {
    setName(INITIAL_NAME);
    setDescription(INITIAL_DESCRIPTION);
    setParentCategoryId("");
    setImageUrl(null);
    resetPreview();
    setEditingCategoryId(null);
    setFieldErrors({});
    setInitialFormState({
      name: INITIAL_NAME,
      description: INITIAL_DESCRIPTION,
      imageUrl: "",
      parentCategoryId: "",
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
    setUploadError(null);
    setEditingCategoryId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setParentCategoryId(category.parent_id !== null ? String(category.parent_id) : "");
    setImageUrl(category.image_url ?? null);
    resetPreview();
    setInitialFormState({
      name: category.name ?? "",
      description: category.description ?? "",
      imageUrl: category.image_url ?? "",
      parentCategoryId: category.parent_id !== null ? String(category.parent_id) : "",
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

  function handleImageSelection(file: File | null) {
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Lütfen geçerli bir görsel dosyası seçin.");
      showToast("Geçersiz dosya türü", "error");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Görsel boyutu en fazla 8MB olabilir.");
      showToast("Görsel boyutu çok büyük", "error");
      return;
    }

    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const localPreview = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(localPreview);
    showToast("Görsel önizlemesi hazır", "info");
  }

  async function uploadCategoryImage(file: File, categoryName: string) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `categories/${Date.now()}-${normalizeForFileName(categoryName) || "kategori"}.${extension}`;

    setUploadStatus("Görsel yükleniyor...");
    const { error: uploadErrorResult } = await supabase.storage
      .from(CATEGORY_BUCKET)
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadErrorResult) {
      throw uploadErrorResult;
    }

    setUploadStatus("Bağlantı hazırlanıyor...");
    const { data } = supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error("Görsel URL alınamadı");
    }

    return data.publicUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setUploadError(null);
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
    const selectedParentId = parentCategoryId ? Number(parentCategoryId) : null;
    const parentCategory =
      selectedParentId !== null
        ? categories.find((category) => category.id === selectedParentId) ?? null
        : null;
    const computedLevel = Math.max(1, Math.min(3, (parentCategory?.level ?? 0) + 1));

    if (selectedParentId !== null && !parentCategory) {
      setFieldErrors({ parent: "Geçerli bir üst kategori seçin." });
      setError("Geçerli bir üst kategori seçin.");
      return;
    }
    if (isEditMode && editingCategoryId !== null && selectedParentId === editingCategoryId) {
      setFieldErrors({ parent: "Kategori kendisinin üst kategorisi olamaz." });
      setError("Kategori kendisinin üst kategorisi olamaz.");
      return;
    }
    if (isEditMode && editingCategoryId !== null && selectedParentId !== null) {
      const descendants = getDescendantCategoryIds(categories, editingCategoryId);
      if (descendants.has(selectedParentId)) {
        setFieldErrors({ parent: "Kategori kendi alt kategorisinin altına taşınamaz." });
        setError("Kategori kendi alt kategorisinin altına taşınamaz.");
        return;
      }
    }
    if (computedLevel > 3) {
      setFieldErrors({ parent: "En fazla 3 seviye kategori oluşturabilirsiniz." });
      setError("En fazla 3 seviye kategori oluşturabilirsiniz.");
      return;
    }

    const snapshot = categories;

    try {
      setIsSaving(true);
      let nextImageUrl = imageUrl;

      if (selectedImageFile) {
        setIsUploadingImage(true);
        nextImageUrl = await uploadCategoryImage(selectedImageFile, trimmed);
      }

      if (isEditMode && editingCategoryId !== null) {
        const optimisticCategories = categories.map((item) =>
          item.id === editingCategoryId
            ? {
                ...item,
                name: trimmed,
                description: trimmedDescription || null,
                image_url: nextImageUrl || null,
                parent_id: selectedParentId,
                level: computedLevel,
              }
            : item,
        );
        setCategories(optimisticCategories);
        setOriginalItems(mapToSortableItems(optimisticCategories));
        setReorderedItems(mapToSortableItems(optimisticCategories));

        const { error: updateError } = await supabase
          .from("category")
          .update({
            name: trimmed,
            description: trimmedDescription || null,
            image_url: nextImageUrl || null,
            parent_id: selectedParentId,
            level: computedLevel,
          })
          .eq("id", editingCategoryId);
        if (updateError) throw updateError;

        setMessage("Kategori güncellendi.");
        showToast("Kategori güncellendi", "success");
      } else {
        const maxPosition = categories.reduce((acc, item) => Math.max(acc, item.position ?? 0), 0);
        const tempId = -Date.now();
        const optimisticItem: CategoryItem = {
          id: tempId,
          name: trimmed,
          description: trimmedDescription || null,
          image_url: nextImageUrl || null,
          parent_id: selectedParentId,
          level: computedLevel,
          position: maxPosition + 1,
        };

        const optimisticCategories = [...categories, optimisticItem];
        setCategories(optimisticCategories);
        setOriginalItems(mapToSortableItems(optimisticCategories));
        setReorderedItems(mapToSortableItems(optimisticCategories));

        const { error: insertError } = await supabase.from("category").insert({
          name: trimmed,
          description: trimmedDescription || null,
          image_url: nextImageUrl || null,
          parent_id: selectedParentId,
          level: computedLevel,
          position: maxPosition + 1,
        });
        if (insertError) throw insertError;

        setMessage("Kategori oluşturuldu.");
        showToast("Kategori oluşturuldu", "success");
      }

      setInitialFormState({
        name: INITIAL_NAME,
        description: INITIAL_DESCRIPTION,
        imageUrl: "",
        parentCategoryId: "",
      });
      resetForm();
      await loadCategories();
    } catch (submitError) {
      console.error(submitError);
      setCategories(snapshot);
      setOriginalItems(mapToSortableItems(snapshot));
      setReorderedItems(mapToSortableItems(snapshot));
      const submitMessage = isEditMode ? "Kategori güncellenemedi." : "Kategori oluşturulamadı.";
      setError(submitMessage);
      showToast(submitMessage, "error");
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
      setUploadStatus("");
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

    const snapshot = categories;

    try {
      setMessage(null);
      setError(null);
      setIsDeletingId(id);

      const optimisticCategories = categories.filter((category) => category.id !== id);
      setCategories(optimisticCategories);
      setOriginalItems(mapToSortableItems(optimisticCategories));
      setReorderedItems(mapToSortableItems(optimisticCategories));

      const { error: deleteError } = await supabase.from("category").delete().eq("id", id);
      if (deleteError) throw deleteError;

      if (editingCategoryId === id) {
        resetForm();
      }

      setMessage("Kategori silindi.");
      showToast("Kategori silindi", "success");
      await loadCategories();
    } catch (deleteActionError) {
      console.error(deleteActionError);
      setCategories(snapshot);
      setOriginalItems(mapToSortableItems(snapshot));
      setReorderedItems(mapToSortableItems(snapshot));
      setError("Kategori silinemedi.");
      showToast("Kategori silinemedi", "error");
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
      showToast("Sıralama güncellendi", "success");
      await loadCategories();
    } catch (saveOrderError) {
      console.error(saveOrderError);
      setError("Kategori sıralaması kaydedilemedi.");
      showToast("Sıralama kaydedilemedi", "error");
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
    void loadCategories();
  }

  async function openOrderModal() {
    try {
      setMessage(null);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("category")
        .select("id,name,slug,description,image_url,parent_id,level,position")
        .order("position", { ascending: true, nullsFirst: false });
      if (fetchError) throw fetchError;
      const next = (data ?? []) as CategoryItem[];
      const items = mapToSortableItems(next, false);
      setOriginalItems(items);
      setReorderedItems(items);
      setIsOrderModalOpen(true);
    } catch (orderError) {
      console.error(orderError);
      setError("Sıralama listesi yüklenemedi.");
    }
  }

  return (
    <section className="space-y-8 md:space-y-10">
      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[240px] rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${
              toast.tone === "success"
                ? "bg-emerald-600/95 text-white"
                : toast.tone === "error"
                  ? "bg-rose-600/95 text-white"
                  : "bg-slate-900/90 text-white"
            }`}
          >
            {toast.title}
          </div>
        ))}
      </div>

      <section
        ref={formSectionRef}
        className="rounded-3xl border border-divider-softLight bg-white p-5 shadow-[0_12px_40px_rgba(16,24,40,0.08)] md:p-7"
      >
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode
            ? "Kategori metnini ve görselini güncelleyerek premium kart görünümünü yönetin."
            : "Yeni kategori oluşturup görünsel ekleyin."}
        </p>
        {hasFormChanges ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Kaydedilmemiş değişiklikler var.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="category-name" className="mb-1 block text-sm font-medium">
                Ad *
              </label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
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
                className="min-h-24 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                placeholder="Kategori açıklaması (maks. 200 karakter)"
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-text-secondary">{description.length}/200</p>
              {fieldErrors.description ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="category-parent" className="mb-1 block text-sm font-medium">
              Üst Kategori
            </label>
            <select
              id="category-parent"
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
              className="h-11 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
              disabled={isSaving}
            >
              <option value="">Yok / Ana kategori</option>
              {primaryCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.parent ? <p className="mt-1 text-xs text-red-600">{fieldErrors.parent}</p> : null}
          </div>

          <div className="rounded-2xl border border-divider-softLight bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text-primary">Kategori Görseli</p>
              {displayedPreviewUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    resetPreview();
                    setImageUrl(null);
                  }}
                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Görseli Kaldır
                </button>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImageSelection(event.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingFile(false);
                handleImageSelection(event.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition ${
                isDraggingFile
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-divider-softLight bg-white hover:border-brand-primary/50"
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <UploadIcon />
              </span>
              <p className="mt-3 text-sm font-semibold text-text-primary">Görsel yüklemek için tıkla veya sürükle bırak</p>
              <p className="mt-1 text-xs text-text-secondary">PNG, JPG, WEBP - en fazla 8MB</p>
            </button>

            {displayedPreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl shadow-lg">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={displayedPreviewUrl}
                    alt="Kategori görsel önizleme"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    unoptimized={displayedPreviewUrl.startsWith("blob:")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                </div>
              </div>
            ) : null}

            {isUploadingImage ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-primary/10 px-3 py-2 text-xs font-medium text-brand-primary">
                <Spinner />
                <span>{uploadStatus || "Yükleniyor..."}</span>
              </div>
            ) : null}
            {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-2 border-t border-divider-softLight bg-white px-5 py-3 sm:mx-0 sm:flex-row sm:items-center sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-secondary disabled:opacity-70 sm:h-10 sm:w-auto"
            >
              {isSaving ? <Spinner /> : null}
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
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-divider-softLight bg-white px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight disabled:opacity-70 sm:h-10 sm:w-auto"
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-divider-softLight bg-white p-5 shadow-[0_12px_40px_rgba(16,24,40,0.08)] md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Mevcut Kategoriler</h3>
          <button
            type="button"
            onClick={openOrderModal}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
          >
            Sıralamayı Düzenle
          </button>
        </div>
        <div className="mt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Ara</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Kategori adı veya açıklaması..."
              className="h-11 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
            />
          </label>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Kategoriler yükleniyor...</p>
        ) : filteredReorderedItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz kategori bulunmuyor.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {getPrimaryCategories(hierarchyOrderedCategories).map((primary) => {
              const children = getDirectChildren(hierarchyOrderedCategories, primary.id);
              const visibleChildren = children.filter((child) => visibleCategoryIds.has(child.id));
              const showPrimary = visibleCategoryIds.has(primary.id) || visibleChildren.length > 0;
              if (!showPrimary) return null;
              return (
                <div key={primary.id} className="rounded-xl border border-divider-softLight bg-surface-pageLight/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{primary.name}</p>
                      <p className="text-xs text-text-secondary">
                        Ana kategori · Seviye {primary.level ?? 1}
                      </p>
                    </div>
                    {categoryActionButtons(primary)}
                  </div>
                  <div className="mt-3 space-y-2 border-l border-divider-softLight pl-3">
                    {visibleChildren.length > 0 ? (
                      visibleChildren.map((child) => {
                        const grandchildren = getDirectChildren(hierarchyOrderedCategories, child.id).filter((item) =>
                          visibleCategoryIds.has(item.id),
                        );
                        return (
                          <div key={child.id} className="rounded-lg bg-white p-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm text-text-primary">{child.name}</p>
                                <p className="text-xs text-text-secondary">
                                  Alt kategori · Seviye {child.level ?? 2}
                                </p>
                              </div>
                              {categoryActionButtons(child)}
                            </div>
                            {grandchildren.length > 0 ? (
                              <div className="mt-2 space-y-1 border-l border-divider-softLight pl-3">
                                {grandchildren.map((grandchild) => (
                                  <div
                                    key={grandchild.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-pageLight px-2 py-1.5"
                                  >
                                    <div>
                                      <p className="text-xs font-medium text-text-primary">{grandchild.name}</p>
                                      <p className="text-[11px] text-text-secondary">
                                        Alt kategori · Seviye {grandchild.level ?? 3}
                                      </p>
                                    </div>
                                    {categoryActionButtons(grandchild)}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-text-secondary">Alt kategori yok.</p>
                    )}
                  </div>
                </div>
              );
            })}
            {hasActiveFilter && getPrimaryCategories(hierarchyOrderedCategories).every((primary) => {
              const children = getDirectChildren(hierarchyOrderedCategories, primary.id);
              return !visibleCategoryIds.has(primary.id) && !children.some((child) => visibleCategoryIds.has(child.id));
            }) ? (
              <p className="text-sm text-text-secondary">Filtreyle eşleşen kategori bulunamadı.</p>
            ) : null}
            <div className="rounded-lg border border-dashed border-divider-softLight bg-white px-3 py-2 text-xs text-text-secondary">
              Üçüncü seviye kategoriler, bağlı oldukları üst kategorinin altına otomatik hizalanır.
            </div>
          </div>
        )}
      </section>

      {isOrderModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-divider-softLight bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider-softLight px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">Kategori Sıralamasını Düzenle</h3>
              <button
                type="button"
                onClick={closeOrderModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(event) => setOrderSearchQuery(event.target.value)}
                  placeholder="Kategori ara..."
                  className="h-10 w-full rounded-xl border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none transition focus:border-brand-primary"
                />
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
                className="inline-flex h-10 items-center justify-center rounded-xl border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary"
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
                className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
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
