"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hasRecoveryUrl =
      url.searchParams.get("type") === "recovery" ||
      hashParams.get("type") === "recovery";

    if (hasRecoveryUrl) {
      setHasRecoverySession(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setIsCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
      }
      setSession(nextSession);
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session || !hasRecoverySession) {
      setErrorMessage("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
      return;
    }

    if (!password) {
      setErrorMessage("Yeni şifre zorunludur.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Şifreler eşleşmiyor.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage("Şifre güncellenemedi. Lütfen bağlantıyı tekrar talep edin.");
        return;
      }

      setSuccessMessage("Şifreniz güncellendi. Yeni şifrenizle tekrar giriş yapabilirsiniz.");
      await supabase.auth.signOut();
      router.replace("/admin/login?reset=success");
      router.refresh();
    } catch {
      setErrorMessage("Şifre güncellenemedi. Lütfen bağlantıyı tekrar talep edin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canResetPassword = Boolean(session && hasRecoverySession);

  return (
    <main className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-divider-softLight bg-surface-pageLight p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text-primary">Yeni Şifre Belirle</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Güvenliğiniz için yeni şifrenizi belirledikten sonra tekrar giriş yapmanız gerekir.
        </p>

        {isCheckingSession ? (
          <p className="mt-6 text-sm text-text-secondary">Şifre sıfırlama bağlantısı kontrol ediliyor...</p>
        ) : canResetPassword ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
                Yeni şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                minLength={8}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-text-primary">
                Yeni şifre tekrar
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-md border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                minLength={8}
                required
              />
            </div>

            {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-divider-softLight bg-white p-4">
            <p className="text-sm font-semibold text-text-primary">
              Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Lütfen yeni bir sıfırlama bağlantısı talep edin veya giriş ekranına dönün.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin/forgot-password"
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary"
              >
                Yeni bağlantı iste
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary transition hover:bg-surface-categoryLight"
              >
                Girişe dön
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
