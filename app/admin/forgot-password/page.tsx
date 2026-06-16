"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("E-posta adresi zorunludur.");
      return;
    }

    try {
      setIsSubmitting(true);
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? "";

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${origin}/admin/reset-password`,
      });

      if (error) {
        setErrorMessage("Şifre sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }

      setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch {
      setErrorMessage("Şifre sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-divider-softLight bg-surface-pageLight p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text-primary">Şifremi Unuttum</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Admin hesabınızın e-posta adresini girin. Size güvenli bir şifre sıfırlama bağlantısı göndereceğiz.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              required
            />
          </div>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <Link
          href="/admin/login"
          className="mt-4 inline-flex text-sm font-semibold text-brand-primary"
        >
          Giriş ekranına dön
        </Link>
      </div>
    </main>
  );
}
