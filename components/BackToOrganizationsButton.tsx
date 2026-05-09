"use client";

import { useRouter } from "next/navigation";

const ORGANIZATIONS_RESTORE_INTENT_KEY = "organizations_showcase_restore_intent_v1";

export function BackToOrganizationsButton() {
  const router = useRouter();

  const handleBack = () => {
    try {
      window.sessionStorage.setItem(ORGANIZATIONS_RESTORE_INTENT_KEY, "1");
    } catch {
      // no-op
    }

    router.push("/organizations");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50/50"
    >
      ← Kurumlara Geri Dön
    </button>
  );
}
