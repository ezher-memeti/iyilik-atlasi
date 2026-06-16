"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CategoryForm() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Kategori adı zorunludur.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: insertError } = await supabase
        .from("category")
        .insert({ name: trimmed, is_visible: isVisible });

      if (insertError) {
        throw insertError;
      }

      setName("");
      setIsVisible(true);
      setMessage("Kategori başarıyla oluşturuldu.");
    } catch (submitError) {
      console.error(submitError);
      setError("Kategori oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Kategori Oluştur</h2>
      <label htmlFor="category-name">Ad</label>
      <input
        id="category-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Kategori adı"
      />
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={isVisible}
          onChange={(event) => setIsVisible(event.target.checked)}
        />
        Kategori görünür olsun
      </label>
      <p>Bu kategori kullanıcı tarafında gösterilsin. Kapatıldığında yalnızca admin panelinde görünür.</p>
      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oluşturuluyor..." : "Kategori Oluştur"}
        </button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
    </form>
  );
}
