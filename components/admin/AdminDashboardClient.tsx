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
  const navItems: Array<{ key: AdminSection; label: string }> = [
    { key: "categories", label: "Kategoriler" },
    { key: "regions", label: "Bölgeler" },
    { key: "ngos", label: "Kurumlar" },
    { key: "projects", label: "Projeler" },
  ];

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-primary disabled:opacity-70 sm:h-10 sm:w-auto"
        >
          {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>
      </header>

      <nav className="mb-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isActive = item.key === activeSection;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`inline-flex h-11 shrink-0 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-primary text-white"
                    : "bg-surface-pageLight text-text-secondary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="overflow-hidden rounded-xl border border-divider-softLight bg-white md:flex">
        <Sidebar activeSection={activeSection} onChange={setActiveSection} />
        <section className="flex-1 p-3 sm:p-4 md:p-6">
          {activeSection === "categories" ? <CategoryPanel /> : null}
          {activeSection === "regions" ? <BolgePanel /> : null}
          {activeSection === "ngos" ? <NgoPanel /> : null}
          {activeSection === "projects" ? <ProjectPanel /> : null}
        </section>
      </div>
    </main>
  );
}
