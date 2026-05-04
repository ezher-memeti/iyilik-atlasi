"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/admin/Sidebar";
import { CategoryPanel } from "@/components/admin/CategoryPanel";
import { BolgePanel } from "@/components/admin/BolgePanel";
import { NgoPanel } from "@/components/admin/NgoPanel";
import { ProjectPanel } from "@/components/admin/ProjectPanel";

type AdminSection = "categories" | "regions" | "ngos" | "projects";

type AdminDashboardClientProps = {
  email: string | null;
};

export function AdminDashboardClient({ email }: AdminDashboardClientProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("categories");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Yönetim Paneli
          </h1>
          <p className="text-sm text-text-secondary">Kategorileri, bölgeleri, kurumları ve projeleri yönetin.</p>
          <p className="mt-1 text-xs text-text-secondary">
            Giriş yapan: {email ?? "bilinmiyor"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary disabled:opacity-70"
        >
          {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>
      </header>

      <div className="overflow-hidden rounded-xl border border-divider-softLight bg-white md:flex">
        <Sidebar activeSection={activeSection} onChange={setActiveSection} />
        <section className="flex-1 p-4 sm:p-6">
          {activeSection === "categories" ? <CategoryPanel /> : null}
          {activeSection === "regions" ? <BolgePanel /> : null}
          {activeSection === "ngos" ? <NgoPanel /> : null}
          {activeSection === "projects" ? <ProjectPanel /> : null}
        </section>
      </div>
    </main>
  );
}
