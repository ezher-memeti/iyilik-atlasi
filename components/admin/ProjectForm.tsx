"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NgoOption = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

export function ProjectForm() {
  const supabase = createClient();
  const [ngos, setNgos] = useState<NgoOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [donationUrl, setDonationUrl] = useState("");
  const [ngoId, setNgoId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoadingOptions(true);
        const [{ data: ngoData, error: ngoError }, { data: categoryData, error: categoryError }] =
          await Promise.all([
            supabase
              .from("ngo")
              .select("id,name")
              .order("position", { ascending: true, nullsFirst: false }),
            supabase
              .from("category")
              .select("id,name")
              .order("position", { ascending: true, nullsFirst: false }),
          ]);

        if (ngoError) throw ngoError;
        if (categoryError) throw categoryError;

        setNgos((ngoData ?? []) as NgoOption[]);
        setCategories((categoryData ?? []) as CategoryOption[]);
      } catch (loadError) {
        console.error(loadError);
        setError("Kurum/kategori seçenekleri yüklenemedi.");
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function toggleCategory(id: number) {
    setSelectedCategoryIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
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

    if (!trimmedUrl) {
      setError("Bağış URL'si zorunludur.");
      return;
    }

    if (Number.isNaN(parsedPrice)) {
      setError("Tutar geçerli bir sayı olmalıdır.");
      return;
    }

    if (selectedCategoryIds.length < 1) {
      setError("Lütfen en az bir kategori seçin.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: insertedProject, error: projectError } = await supabase
        .from("project")
        .insert({
          title: trimmedTitle,
          price: parsedPrice,
          donation_url: trimmedUrl,
          ngo_id: Number(ngoId),
        })
        .select("id")
        .single();

      if (projectError || !insertedProject) {
        throw projectError ?? new Error("Proje ekleme işlemi başarısız.");
      }

      const junctionPayload = selectedCategoryIds.map((categoryId) => ({
        project_id: insertedProject.id,
        category_id: categoryId,
      }));

      const { error: junctionError } = await supabase
        .from("project_categories")
        .insert(junctionPayload);

      if (junctionError) {
        throw junctionError;
      }

      setTitle("");
      setPrice("");
      setDonationUrl("");
      setNgoId("");
      setSelectedCategoryIds([]);
      setMessage("Proje başarıyla oluşturuldu.");
    } catch (submitError) {
      console.error(submitError);
      setError("Proje oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Proje Oluştur</h2>

      {isLoadingOptions ? <p>Kurum ve kategori seçenekleri yükleniyor...</p> : null}

      <label htmlFor="project-title">Başlık</label>
      <input
        id="project-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Proje başlığı"
      />

      <label htmlFor="project-price">Tutar</label>
      <input
        id="project-price"
        type="number"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        placeholder="0"
      />

      <label htmlFor="project-donation-url">Bağış URL</label>
      <input
        id="project-donation-url"
        type="url"
        value={donationUrl}
        onChange={(event) => setDonationUrl(event.target.value)}
        placeholder="https://example.org/donate"
      />

      <label htmlFor="project-ngo">Kurum</label>
      <select id="project-ngo" value={ngoId} onChange={(event) => setNgoId(event.target.value)}>
        <option value="">Kurum seçin</option>
        {ngos.map((ngo) => (
          <option key={ngo.id} value={ngo.id}>
            {ngo.name}
          </option>
        ))}
      </select>

      <fieldset>
        <legend>Kategoriler (en az 1 seçim yapın)</legend>
        {categories.map((category) => (
          <label key={category.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selectedCategoryIds.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
            {category.name}
          </label>
        ))}
      </fieldset>

      <div>
        <button type="submit" disabled={isSubmitting || isLoadingOptions}>
          {isSubmitting ? "Oluşturuluyor..." : "Proje Oluştur"}
        </button>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
    </form>
  );
}
