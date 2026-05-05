"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAdminTextValidationMessage,
  isAllowedAdminText,
} from "@/lib/adminTextValidation";

type BolgeItem = {
  id: number;
  name: string;
};

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

export function BolgePanel() {
  const supabase = createClient();
  const [items, setItems] = useState<BolgeItem[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = editingId !== null;
  const title = useMemo(() => (isEditMode ? "Bölge Düzenle" : "Bölge Oluştur"), [isEditMode]);

  async function loadItems() {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("bolge")
        .select("id,name")
        .order("id", { ascending: true });
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
      if (isEditMode && editingId !== null) {
        const { error: updateError } = await supabase
          .from("bolge")
          .update({ name: trimmed })
          .eq("id", editingId);
        if (updateError) {
          setError(`Bölge güncellenemedi: ${parseSupabaseError(updateError, "Servis hatası")}`);
          return;
        }
        setMessage("Bölge güncellendi.");
      } else {
        const { error: insertError } = await supabase.from("bolge").insert({ name: trimmed });
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Mevcut Bölgeler
        </h3>
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
                <p className="text-sm font-medium text-text-primary">{item.name}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setName(item.name);
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
    </section>
  );
}
