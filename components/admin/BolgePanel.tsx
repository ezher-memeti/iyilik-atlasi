"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";

type BolgeItem = {
  id: number;
  name: string;
  is_visible: boolean;
  position?: number | null;
};

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isVisible
          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {isVisible ? "Görünür" : "Gizli"}
    </span>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {
      return "Bilinmeyen hata";
    }
  }
  return "Bilinmeyen hata";
}

function parseSupabaseError(error: unknown, fallback: string) {
  const message = getErrorMessage(error).trim();
  if (!message || message === "{}" || message === "Bilinmeyen hata") {
    return fallback;
  }
  return message;
}

function arrayMoveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function BolgePanel() {
  const supabase = createClient();
  const [items, setItems] = useState<BolgeItem[]>([]);
  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [originalOrderItems, setOriginalOrderItems] = useState<SortableListItem[]>([]);
  const [orderItems, setOrderItems] = useState<SortableListItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = editingId !== null;
  const title = useMemo(() => (isEditMode ? "Bölge Düzenle" : "Bölge Oluştur"), [isEditMode]);
  const hasUnsavedOrder = useMemo(() => {
    if (originalOrderItems.length !== orderItems.length) return true;
    return orderItems.some((item, index) => item.id !== originalOrderItems[index]?.id);
  }, [orderItems, originalOrderItems]);
  const filteredOrderItems = useMemo(() => {
    const query = orderSearchQuery.trim().toLocaleLowerCase("tr-TR");
    if (!query) return orderItems;
    return orderItems.filter((item) =>
      item.primary.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [orderItems, orderSearchQuery]);
  const globalOrderIndexById = useMemo(
    () =>
      orderItems.reduce<Record<number, number>>((acc, item, index) => {
        acc[item.id] = index;
        return acc;
      }, {}),
    [orderItems],
  );

  async function loadItems() {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("bolge")
        .select("*")
        .order("id", { ascending: false });
      if (fetchError) throw fetchError;
      setItems((data ?? []) as BolgeItem[]);
    } catch (loadError) {
      setError(`Bölgeler yüklenemedi: ${parseSupabaseError(loadError, "Servis hatası")}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function resetForm() {
    setName("");
    setIsVisible(true);
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bölge adı zorunludur.");
      return;
    }
    if (!isAllowedAdminText(trimmed)) {
      setError(getAdminTextValidationMessage("Bölge adı"));
      return;
    }

    try {
      setIsSaving(true);
      const payload = { name: trimmed, is_visible: isVisible };
      if (isEditMode && editingId !== null) {
        const { error: updateError } = await supabase
          .from("bolge")
          .update(payload)
          .eq("id", editingId);
        if (updateError) {
          setError(`Bölge güncellenemedi: ${parseSupabaseError(updateError, "Servis hatası")}`);
          return;
        }
        setMessage("Bölge güncellendi.");
      } else {
        const { error: insertError } = await supabase.from("bolge").insert(payload);
        if (insertError) {
          setError(`Bölge oluşturulamadı: ${parseSupabaseError(insertError, "Servis hatası")}`);
          return;
        }
        setMessage("Bölge oluşturuldu.");
      }
      resetForm();
      await loadItems();
    } catch (submitError) {
      setError(
        `${isEditMode ? "Bölge güncellenemedi" : "Bölge oluşturulamadı"}: ${parseSupabaseError(
          submitError,
          "Beklenmeyen hata",
        )}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Bu bölgeyi silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      setMessage(null);
      setError(null);
      setIsDeletingId(id);
      const { error: deleteError } = await supabase.from("bolge").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (editingId === id) resetForm();
      setMessage("Bölge silindi.");
      await loadItems();
    } catch (deleteActionError) {
      setError(`Bölge silinemedi: ${parseSupabaseError(deleteActionError, "Servis hatası")}`);
    } finally {
      setIsDeletingId(null);
    }
  }

  function buildSortableItems(next: BolgeItem[]) {
    return next.map((item) => ({
      id: item.id,
      primary: item.name,
      meta: `ID: ${item.id}`,
      status: <VisibilityBadge isVisible={item.is_visible} />,
      isHighlighted: editingId === item.id,
    }));
  }

  async function openOrderModal() {
    try {
      setMessage(null);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("bolge")
        .select("*")
        .order("position", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;
      const next = (data ?? []) as BolgeItem[];
      const sortable = buildSortableItems(next);
      setOriginalOrderItems(sortable);
      setOrderItems(sortable);
      setIsOrderModalOpen(true);
    } catch (orderError) {
      setError(`Sıralama listesi yüklenemedi: ${parseSupabaseError(orderError, "Servis hatası")}`);
    }
  }

  function cancelOrderEdit() {
    setOrderItems(originalOrderItems);
    setIsOrderModalOpen(false);
  }

  function applyFilteredOrder(nextFiltered: SortableListItem[]) {
    const filteredIds = new Set(nextFiltered.map((item) => item.id));
    const queue = [...nextFiltered];
    setOrderItems((current) =>
      current.map((item) => (filteredIds.has(item.id) ? (queue.shift() ?? item) : item)),
    );
  }

  function moveOrderItemToGlobalIndex(itemId: number, targetIndex: number) {
    setOrderItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === itemId);
      if (fromIndex === -1) return current;
      const clamped = Math.max(0, Math.min(current.length - 1, targetIndex));
      return arrayMoveItem(current, fromIndex, clamped);
    });
  }

  async function saveOrder() {
    if (!hasUnsavedOrder) {
      setIsOrderModalOpen(false);
      return;
    }

    try {
      setIsSavingOrder(true);
      setMessage(null);
      setError(null);
      for (let index = 0; index < orderItems.length; index += 1) {
        const item = orderItems[index];
        const { error: updateError } = await supabase
          .from("bolge")
          .update({ position: index + 1 })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }
      setMessage("Bölge sıralaması kaydedildi.");
      setIsOrderModalOpen(false);
      await loadItems();
    } catch (saveError) {
      setError(`Bölge sıralaması kaydedilemedi: ${parseSupabaseError(saveError, "Servis hatası")}`);
    } finally {
      setIsSavingOrder(false);
    }
  }

  return (
    <section className="space-y-8">
      <section className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode ? "Bölge bilgisini güncelleyin." : "Yeni bölge ekleyin."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label htmlFor="bolge-name" className="mb-1 block text-sm font-medium">
              Bölge adı *
            </label>
            <input
              id="bolge-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Örn: Marmara"
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-divider-softLight bg-white px-3 py-3">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
              disabled={isSaving}
              className="mt-1 h-4 w-4 rounded border-divider-softLight text-brand-primary focus:ring-brand-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-text-primary">
                Bölge görünür olsun
              </span>
              <span className="mt-1 block text-xs leading-5 text-text-secondary">
                Bu bölge kullanıcı tarafında gösterilsin. Kapatıldığında yalnızca admin panelinde görünür.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSaving ? "Kaydediliyor..." : isEditMode ? "Bölgeyi Güncelle" : "Bölge Ekle"}
            </button>

            {isEditMode ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary"
              >
                Düzenlemeyi İptal Et
              </button>
            ) : null}
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Mevcut Bölgeler
          </h3>
          <button
            type="button"
            onClick={openOrderModal}
            className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
          >
            Sıralamayı Düzenle
          </button>
        </div>
        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Bölgeler yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz bölge bulunmuyor.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
                  editingId === item.id
                    ? "border-brand-primary bg-brand-secondary/10"
                    : "border-divider-softLight bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{item.name}</p>
                  <VisibilityBadge isVisible={item.is_visible} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setName(item.name);
                      setIsVisible(item.is_visible);
                      setMessage(null);
                      setError(null);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-700"
                  >
                    {isDeletingId === item.id ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isOrderModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-divider-softLight bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider-softLight px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">Bölge Sıralamasını Düzenle</h3>
              <button
                type="button"
                onClick={cancelOrderEdit}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                aria-label="Kapat"
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
                  placeholder="Bölge ara..."
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <SortableOrderList
                items={filteredOrderItems}
                showQuickMove
                totalItemsCount={orderItems.length}
                onMoveToGlobalIndex={moveOrderItemToGlobalIndex}
                globalIndexById={globalOrderIndexById}
                onReorder={applyFilteredOrder}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-divider-softLight px-4 py-3">
              <button
                type="button"
                onClick={cancelOrderEdit}
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveOrder}
                disabled={isSavingOrder}
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
