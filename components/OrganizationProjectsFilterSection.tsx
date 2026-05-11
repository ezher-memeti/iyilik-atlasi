"use client";

import { useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import type { OrganizationProjectProfile } from "@/lib/organizationProjects";

type OrganizationProjectsFilterSectionProps = {
  projects: OrganizationProjectProfile[];
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrganizationProjectsFilterSection({
  projects,
}: OrganizationProjectsFilterSectionProps) {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showTabArrows, setShowTabArrows] = useState(false);
  const categoryCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const category of project.categories) {
        const key = category.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        projects
          .flatMap((project) => project.categories)
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "tr"));

    return ["Tümü", ...unique];
  }, [projects]);

  const visibleProjects = useMemo(() => {
    if (activeCategory === "Tümü") return projects;
    return projects.filter((project) =>
      project.categories.some((category) => category.trim() === activeCategory),
    );
  }, [projects, activeCategory]);

  useEffect(() => {
    const scrollElement = tabsScrollRef.current;
    if (!scrollElement) return;

    const update = () => {
      const maxLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
      setCanScrollLeft(scrollElement.scrollLeft > 0);
      setCanScrollRight(scrollElement.scrollLeft < maxLeft - 1);
      setShowTabArrows(scrollElement.scrollWidth > scrollElement.clientWidth + 1);
    };

    update();
    scrollElement.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      scrollElement.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [categories]);

  useEffect(() => {
    const selectedButton = categoryButtonRefs.current[activeCategory];
    const scroller = tabsScrollRef.current;
    if (!selectedButton || !scroller) return;
    const buttonLeft = selectedButton.offsetLeft;
    const buttonWidth = selectedButton.offsetWidth;
    const targetLeft = buttonLeft - scroller.clientWidth / 2 + buttonWidth / 2;
    scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [activeCategory]);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Projeler
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F2937]">
            Bağış Seçenekleri
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Kurumun aktif bağış projelerini inceleyin.
          </p>

        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-divider-softLight bg-white/80 p-4 backdrop-blur-sm sm:p-5">
        <div className="relative md:px-10">
          <div
            ref={tabsScrollRef}
            className="overflow-x-auto border-b border-divider-softLight pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max min-w-full gap-6 pr-4 sm:gap-8 sm:pr-6">
              {categories.map((category) => {
                const active = category === activeCategory;
                const count =
                  category === "Tümü"
                    ? projects.length
                    : (categoryCountMap.get(category) ?? 0);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    ref={(el) => {
                      categoryButtonRefs.current[category] = el;
                    }}
                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition-colors duration-200 ${active
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    aria-pressed={active}
                  >
                    {category}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${active
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {showTabArrows ? (
            <>
              <button
                type="button"
                aria-label="Kategorilerde sola kaydır"
                onClick={() =>
                  tabsScrollRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                }
                disabled={!canScrollLeft}
                className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-divider-softLight bg-surface-pageLight p-2 text-text-primary shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                aria-label="Kategorilerde sağa kaydır"
                onClick={() =>
                  tabsScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                }
                disabled={!canScrollRight}
                className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-divider-softLight bg-surface-pageLight p-2 text-text-primary shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
              >
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 px-4 py-2 text-sm text-[#6B7280]">
        {activeCategory === "Tümü"
          ? `Toplam ${visibleProjects.length} proje listeleniyor.`
          : `${activeCategory} kategorisinde ${visibleProjects.length} proje listeleniyor.`}
      </div>

      <div
        key={activeCategory}
        className="mt-6 grid gap-5 transition-all duration-200 sm:grid-cols-2 xl:grid-cols-3"
      >
        {visibleProjects.map((project) => (
          <article
            key={`${activeCategory}-${project.id}`}
            className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                {project.categories[0] || "Belirtilmedi"}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {project.price ? formatPrice(project.price) : "Tutar belirtilmedi"}
              </span>
            </div>

            <h3 className="mt-3 text-base font-semibold leading-6 text-[#1F2937]">
              {project.name}
            </h3>

            <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6B7280]">
              {project.description}
            </p>

            <div className="mt-4 space-y-2">
              {project.regions && project.regions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.regions.map((region) => (
                    <span
                      key={`${project.id}-${region}`}
                      className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">Bölge bilgisi belirtilmedi</p>
              )}
            </div>

            <a
              href={project.donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-700/30 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700/40 hover:bg-emerald-100 group-hover:bg-emerald-100"
            >
              Resmi Bağış Sayfasına Git →
            </a>
          </article>
        ))}
      </div>

      {!visibleProjects.length ? (
        <p className="mt-6 text-sm text-[#6B7280]">
          Seçtiğiniz kategori için proje bulunamadı.
        </p>
      ) : null}
    </section>
  );
}
