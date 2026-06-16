"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setResetSuccess(new URLSearchParams(window.location.search).get("reset") === "success");
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-divider-softLight bg-surface-pageLight p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Yönetici Girişi
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Yönetim paneline erişmek için hesabınızla giriş yapın.
        </p>
        {resetSuccess ? (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
          </p>
        ) : null}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                Şifre
              </label>
              <Link href="/admin/forgot-password" className="text-xs font-semibold text-brand-primary">
                Şifremi unuttum
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </main>
  );
}
