"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SortableOrderList, type SortableListItem } from "@/components/admin/SortableOrderList";

type NgoItem = {
  id: number;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  position: number | null;
  ngo_bolge?: Array<{ bolge: { id: number; name: string } | { id: number; name: string }[] | null }> | null;
};
type RegionOption = { id: number; name: string };
type NgoBolgeRow = { bolge_id: number };

const INITIAL_FORM = {
  name: "",
  description: "",
  websiteUrl: "",
  logoUrl: "",
};

function shorten(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function extractRegionName(
  bolge: { id: number; name: string } | { id: number; name: string }[] | null | undefined,
) {
  if (!bolge) return null;
  if (Array.isArray(bolge)) return bolge[0]?.name ?? null;
  return bolge.name;
}

export function NgoPanel() {
  const supabase = createClient();
  const hasActiveFilter = false;

  const [ngos, setNgos] = useState<NgoItem[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [originalItems, setOriginalItems] = useState<SortableListItem[]>([]);
  const [reorderedItems, setReorderedItems] = useState<SortableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [name, setName] = useState(INITIAL_FORM.name);
  const [description, setDescription] = useState(INITIAL_FORM.description);
  const [websiteUrl, setWebsiteUrl] = useState(INITIAL_FORM.websiteUrl);
  const [logoUrl, setLogoUrl] = useState(INITIAL_FORM.logoUrl);
  const [selectedRegionIds, setSelectedRegionIds] = useState<number[]>([]);
  const [editingNgoId, setEditingNgoId] = useState<number | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = editingNgoId !== null;
  const sectionTitle = useMemo(
    () => (isEditMode ? "Kurum Düzenle" : "Kurum Oluştur"),
    [isEditMode],
  );
  const hasUnsavedOrder = useMemo(() => {
    if (originalItems.length !== reorderedItems.length) return true;
    return reorderedItems.some((item, index) => item.id !== originalItems[index]?.id);
  }, [originalItems, reorderedItems]);

  async function loadNgos() {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from("ngo")
        .select("id,name,description,website_url,logo_url,position,ngo_bolge(bolge:bolge_id(id,name))");
      query = hasActiveFilter
        ? query.order("id", { ascending: true })
        : query.order("position", { ascending: true, nullsFirst: false });
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      const next = (data ?? []) as NgoItem[];
      setNgos(next);
      const listItems = next.map((ngo) => ({
        id: ngo.id,
        primary: ngo.name,
        secondary: [
          ngo.description ? shorten(ngo.description) : "Açıklama yok",
          ngo.logo_url ? "Logo URL tanımlı" : "Logo yok",
          (ngo.ngo_bolge ?? [])
            .map((item) => extractRegionName(item.bolge))
            .filter(Boolean)
            .join(", "),
        ]
          .filter(Boolean)
          .join(" · "),
        link: ngo.website_url,
        isHighlighted: editingNgoId === ngo.id,
        actions: (
          <>
            <button
              type="button"
              onClick={() => handleEdit(ngo)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => handleDelete(ngo.id)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              {isDeletingId === ngo.id ? "Siliniyor..." : "Sil"}
            </button>
          </>
        ),
      }));

      setOriginalItems(listItems);
      setReorderedItems(listItems);

      const { data: regionData, error: regionError } = await supabase
        .from("bolge")
        .select("id,name")
        .order("id");
      if (regionError) throw regionError;
      setRegions((regionData ?? []) as RegionOption[]);
    } catch (loadError) {
      console.error(loadError);
      setError("Kurumlar yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNgos();
  }, [editingNgoId, isDeletingId]);

  function resetForm() {
    setName(INITIAL_FORM.name);
    setDescription(INITIAL_FORM.description);
    setWebsiteUrl(INITIAL_FORM.websiteUrl);
    setLogoUrl(INITIAL_FORM.logoUrl);
    setSelectedRegionIds([]);
    setEditingNgoId(null);
  }

  function toggleRegion(regionId: number) {
    setSelectedRegionIds((current) =>
      current.includes(regionId)
        ? current.filter((value) => value !== regionId)
        : [...current, regionId],
    );
  }

  function validateForm() {
    if (!name.trim()) {
      return "Kurum adı zorunludur.";
    }

    if (websiteUrl.trim()) {
      try {
        const parsed = new URL(websiteUrl.trim());
        if (!["https:", "http:"].includes(parsed.protocol)) {
          return "Web sitesi adresi http:// veya https:// ile başlamalıdır.";
        }
      } catch {
        return "Web sitesi adresi geçerli bir URL olmalıdır.";
      }
    }

    if (logoUrl.trim()) {
      try {
        const parsed = new URL(logoUrl.trim());
        if (!["https:", "http:"].includes(parsed.protocol)) {
          return "Logo URL adresi http:// veya https:// ile başlamalıdır.";
        }
      } catch {
        return "Logo URL adresi geçerli bir URL olmalıdır.";
      }
    }

    return null;
  }

  async function handleEdit(ngo: NgoItem) {
    setMessage(null);
    setError(null);
    try {
      setIsSaving(true);
      const { data, error: relationError } = await supabase
        .from("ngo_bolge")
        .select("bolge_id")
        .eq("ngo_id", ngo.id);
      if (relationError) throw relationError;

      setEditingNgoId(ngo.id);
      setName(ngo.name ?? "");
      setDescription(ngo.description ?? "");
      setWebsiteUrl(ngo.website_url ?? "");
      setLogoUrl(ngo.logo_url ?? "");
      setSelectedRegionIds(((data ?? []) as NgoBolgeRow[]).map((item) => item.bolge_id));
    } catch (editError) {
      console.error(editError);
      setError("Kurum bölge bilgileri yüklenemedi.");
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

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      website_url: websiteUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
    };

    try {
      setIsSaving(true);

      if (isEditMode && editingNgoId !== null) {
        const { error: updateError } = await supabase
          .from("ngo")
          .update(payload)
          .eq("id", editingNgoId);

        if (updateError) throw updateError;
        const { error: deleteRegionsError } = await supabase
          .from("ngo_bolge")
          .delete()
          .eq("ngo_id", editingNgoId);
        if (deleteRegionsError) throw deleteRegionsError;

        if (selectedRegionIds.length > 0) {
          const regionPayload = selectedRegionIds.map((regionId) => ({
            ngo_id: editingNgoId,
            bolge_id: regionId,
          }));
          const { error: insertRegionsError } = await supabase
            .from("ngo_bolge")
            .insert(regionPayload);
          if (insertRegionsError) throw insertRegionsError;
        }
        setMessage("Kurum başarıyla güncellendi.");
      } else {
        const maxPosition = ngos.reduce((acc, item) => Math.max(acc, item.position ?? 0), 0);
        const { data: insertedNgo, error: insertError } = await supabase
          .from("ngo")
          .insert({ ...payload, position: maxPosition + 1 })
          .select("id")
          .single();
          
        if (insertError) throw insertError;
        const insertedId = insertedNgo?.id ?? null;
        if (insertedId && selectedRegionIds.length > 0) {
          const regionPayload = selectedRegionIds.map((regionId) => ({
            ngo_id: insertedId,
            bolge_id: regionId,
          }));
          const { error: insertRegionsError } = await supabase
            .from("ngo_bolge")
            .insert(regionPayload);
          if (insertRegionsError) throw insertRegionsError;
        }
        setMessage("Kurum başarıyla oluşturuldu.");
      }

      resetForm();
      await loadNgos();
    } catch (submitError) {
      console.error(submitError);
      setError(isEditMode ? "Kurum güncellenemedi." : "Kurum oluşturulamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Bu kurumu silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      setMessage(null);
      setError(null);
      setIsDeletingId(id);

      const { error: deleteError } = await supabase.from("ngo").delete().eq("id", id);
      if (deleteError) throw deleteError;

      if (editingNgoId === id) {
        resetForm();
      }

      setMessage("Kurum başarıyla silindi.");
      await loadNgos();
    } catch (deleteActionError) {
      console.error(deleteActionError);
      setError("Kurum silinemedi.");
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
          .from("ngo")
          .update({ position: index + 1 })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }

      setMessage("Kurum sıralaması kaydedildi.");
      await loadNgos();
    } catch (saveOrderError) {
      console.error(saveOrderError);
      setError("Kurum sıralaması kaydedilemedi.");
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
    <section className="space-y-8">
      <section className="rounded-xl border border-divider-softLight bg-surface-pageLight p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {sectionTitle}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isEditMode
            ? "Kurum bilgilerini güncelleyip değişiklikleri kaydedin."
            : "Sisteme yeni bir kurum kaydı ekleyin."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ngo-name" className="mb-1 block text-sm font-medium">
              Ad *
            </label>
            <input
              id="ngo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm outline-none transition focus:border-brand-primary"
              placeholder="Kurum adı"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="ngo-description" className="mb-1 block text-sm font-medium">
              Açıklama
            </label>
            <textarea
              id="ngo-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-md border border-divider-softLight bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-primary"
              placeholder="Kısa kurum açıklaması"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="ngo-website" className="mb-1 block text-sm font-medium">
              Web Sitesi URL
            </label>
            <input
              id="ngo-website"
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm outline-none transition focus:border-brand-primary"
              placeholder="https://example.org"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="ngo-logo-url" className="mb-1 block text-sm font-medium">
              Logo URL
            </label>
            <input
              id="ngo-logo-url"
              type="text"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className="h-10 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm outline-none transition focus:border-brand-primary"
              placeholder="https://example.com/logo.png"
              disabled={isSaving}
            />
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">Faaliyet Bölgeleri</legend>
            <div className="grid gap-2 sm:grid-cols-2">
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving
                ? isEditMode
                  ? "Güncelleniyor..."
                  : "Oluşturuluyor..."
                : isEditMode
                  ? "Kurumu Güncelle"
                  : "Kurum Oluştur"}
            </button>

            {isEditMode ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight disabled:opacity-70"
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
            Mevcut Kurumlar
          </h3>
          {hasUnsavedOrder ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Kaydedilmemiş sıralama değişikliği var
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-text-secondary">Kurumlar yükleniyor...</p>
        ) : reorderedItems.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Henüz kurum bulunmuyor.</p>
        ) : (
          <>
            <div className="mt-4">
              <SortableOrderList items={reorderedItems} onReorder={setReorderedItems} />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={!hasUnsavedOrder || isSavingOrder}
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary disabled:opacity-60"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={!hasUnsavedOrder || isSavingOrder || hasActiveFilter}
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
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
