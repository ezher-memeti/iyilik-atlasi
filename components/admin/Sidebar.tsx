"use client";

type AdminSection = "categories" | "regions" | "ngos" | "projects";

type SidebarProps = {
  activeSection: AdminSection;
  onChange: (section: AdminSection) => void;
};

const items: Array<{ key: AdminSection; label: string }> = [
  { key: "categories", label: "Kategoriler" },
  { key: "regions", label: "Bölgeler" },
  { key: "ngos", label: "Kurumlar" },
  { key: "projects", label: "Projeler" },
];

export function Sidebar({ activeSection, onChange }: SidebarProps) {
  return (
    <aside className="w-full border-b border-divider-softLight bg-surface-pageLight p-4 md:w-64 md:border-b-0 md:border-r md:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Yönetim
      </h2>
      <nav className="mt-4 flex gap-2 md:flex-col">
        {items.map((item) => {
          const isActive = item.key === activeSection;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "bg-transparent text-text-secondary hover:bg-surface-categoryLight hover:text-text-primary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
