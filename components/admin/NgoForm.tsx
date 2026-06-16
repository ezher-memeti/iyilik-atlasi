"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NgoForm() {
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
      setError("Kurum adı zorunludur.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: insertError } = await supabase
        .from("ngo")
        .insert({ name: trimmed, is_visible: isVisible });

      if (insertError) {
        throw insertError;
      }

      setName("");
      setIsVisible(true);
      setMessage("Kurum başarıyla oluşturuldu.");
    } catch (submitError) {
      console.error(submitError);
      setError("Kurum oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Kurum Oluştur</h2>
      <label htmlFor="ngo-name">Ad</label>
      <input
        id="ngo-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Kurum adı"
      />
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={isVisible}
          onChange={(event) => setIsVisible(event.target.checked)}
        />
        Kurum görünür olsun
      </label>
      <p>Bu kurum kullanıcı tarafında gösterilsin. Kapatıldığında kurum ve kuruma bağlı projeler kullanıcı tarafında görünmez.</p>
      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oluşturuluyor..." : "Kurum Oluştur"}
        </button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
    </form>
  );
}
