"use client";

import { useEffect, useMemo, useState } from "react";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProjectCard } from "@/components/ProjectCard";
import common from "@/content/common.json";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/kurban";

type OrganizationGroup = {
  organization: {
    name: string;
    slug: string;
    description?: string;
    founded?: string;
  };
  projects: KurbanProjectWithOrganization[];
};

type KurbanComparisonClientProps = {
  groups: OrganizationGroup[];
  projects: KurbanProjectWithOrganization[];
};

type SortType = "price" | "popular" | "az";

const DEFAULT_SEARCH = "";
const DEFAULT_PRICE_FILTER = "all";
const DEFAULT_REGION_FILTER = "all";
const DEFAULT_SORT: SortType = "popular";

export function KurbanComparisonClient({
  groups,
  projects,
}: KurbanComparisonClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [openOrganization, setOpenOrganization] = useState(
    groups[0]?.organization.slug ?? "",
  );

  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [priceFilter, setPriceFilter] = useState(DEFAULT_PRICE_FILTER);
  const [regionFilter, setRegionFilter] = useState(DEFAULT_REGION_FILTER);
  const [sortBy, setSortBy] = useState<SortType>(DEFAULT_SORT);

  const [expandedOrg, setExpandedOrg] = useState<Record<string, boolean>>({});

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSheetMode, setMobileSheetMode] = useState<"filter" | "sort">(
    "filter",
  );
  const [draftSearch, setDraftSearch] = useState(DEFAULT_SEARCH);
  const [draftPriceFilter, setDraftPriceFilter] = useState(DEFAULT_PRICE_FILTER);
  const [draftRegionFilter, setDraftRegionFilter] = useState(DEFAULT_REGION_FILTER);
  const [draftSortBy, setDraftSortBy] = useState<SortType>(DEFAULT_SORT);

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.includes(project.id)),
    [projects, selectedIds],
  );

  const selectedCountByOrg = useMemo(() => {
    const map: Record<string, number> = {};

    groups.forEach((group) => {
      map[group.organization.slug] = group.projects.filter((project) =>
        selectedIds.includes(project.id),
      ).length;
    });

    return map;
  }, [groups, selectedIds]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return groups
      .map((group) => {
        const filteredProjects = group.projects
          .filter((project) => {
            if (!query) {
              return true;
            }

            return (
              group.organization.name.toLocaleLowerCase("tr-TR").includes(query) ||
              project.title.toLocaleLowerCase("tr-TR").includes(query) ||
              project.description.toLocaleLowerCase("tr-TR").includes(query)
            );
          })
          .filter((project) => {
            if (priceFilter === "all") {
              return true;
            }
            if (priceFilter === "0-7000") {
              return project.price > 0 && project.price <= 7000;
            }
            if (priceFilter === "7000-12000") {
              return project.price > 7000 && project.price <= 12000;
            }

            return project.price > 12000;
          })
          .filter((project) => {
            if (regionFilter === "all") {
              return true;
            }

            const text = `${project.type} ${project.title} ${project.description}`.toLocaleLowerCase(
              "tr-TR",
            );

            if (regionFilter === "yurt-ici") {
              return (
                text.includes("yurt içi") ||
                text.includes("turkiye") ||
                text.includes("türkiye") ||
                project.type === "yurt-ici"
              );
            }

            return (
              text.includes("yurt dışı") ||
              text.includes("gazze") ||
              text.includes("filistin") ||
              text.includes("afrika") ||
              project.type === "yurt-disi" ||
              project.type === "filistin"
            );
          })
          .sort((a, b) => {
            if (sortBy === "price") {
              const aPrice = a.price > 0 ? a.price : Number.MAX_SAFE_INTEGER;
              const bPrice = b.price > 0 ? b.price : Number.MAX_SAFE_INTEGER;
              return aPrice - bPrice;
            }

            if (sortBy === "az") {
              return a.title.localeCompare(b.title, "tr");
            }

            return 0;
          });

        return {
          ...group,
          projects: filteredProjects,
        };
      })
      .filter((group) => group.projects.length > 0);
  }, [groups, priceFilter, regionFilter, search, sortBy]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (regionFilter === "yurt-ici") {
      parts.push("Yurt içi");
    } else if (regionFilter === "yurt-disi") {
      parts.push("Yurt dışı");
    }

    if (priceFilter === "0-7000") {
      parts.push("₺0–₺7.000");
    } else if (priceFilter === "7000-12000") {
      parts.push("₺7.001–₺12.000");
    } else if (priceFilter === "12000+") {
      parts.push("₺12.000+");
    }

    if (search.trim()) {
      parts.push(`"${search.trim()}"`);
    }

    return parts.length ? parts.join(" • ") : "Tüm projeler";
  }, [priceFilter, regionFilter, search]);

  useEffect(() => {
    if (!filteredGroups.length) {
      setOpenOrganization("");
      return;
    }

    const exists = filteredGroups.some(
      (group) => group.organization.slug === openOrganization,
    );

    if (!exists) {
      setOpenOrganization(filteredGroups[0].organization.slug);
    }
  }, [filteredGroups, openOrganization]);

  const recommendedProjectIds = useMemo(() => {
    const map: Record<string, string> = {};

    filteredGroups.forEach((group) => {
      const nonZero = group.projects.filter((project) => project.price > 0);
      const recommended =
        nonZero.sort((a, b) => a.price - b.price)[0] ?? group.projects[0];

      if (recommended) {
        map[group.organization.slug] = recommended.id;
      }
    });

    return map;
  }, [filteredGroups]);

  const pricePreviewByOrg = useMemo(() => {
    const map: Record<string, string | null> = {};

    filteredGroups.forEach((group) => {
      const prices = group.projects
        .map((project) => project.price)
        .filter((price) => price > 0)
        .sort((a, b) => a - b);

      if (prices.length === 0) {
        map[group.organization.slug] = null;
        return;
      }

      const min = prices[0];
      const max = prices[prices.length - 1];
      map[group.organization.slug] =
        min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
    });

    return map;
  }, [filteredGroups]);

  function toggleProject(projectId: string) {
    setSelectedIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
    setIsCompareOpen(false);
  }

  function removeProject(projectId: string) {
    setSelectedIds((current) => current.filter((id) => id !== projectId));
  }

  function toggleExpand(slug: string) {
    setExpandedOrg((current) => ({
      ...current,
      [slug]: !current[slug],
    }));
  }

  function openMobileSheet(mode: "filter" | "sort") {
    setMobileSheetMode(mode);
    setDraftSearch(search);
    setDraftPriceFilter(priceFilter);
    setDraftRegionFilter(regionFilter);
    setDraftSortBy(sortBy);
    setIsMobileFilterOpen(true);
  }

  function applyMobileFilters() {
    setSearch(draftSearch);
    setPriceFilter(draftPriceFilter);
    setRegionFilter(draftRegionFilter);
    setSortBy(draftSortBy);
    setIsMobileFilterOpen(false);
  }

  function clearMobileFilters() {
    setDraftSearch(DEFAULT_SEARCH);
    setDraftPriceFilter(DEFAULT_PRICE_FILTER);
    setDraftRegionFilter(DEFAULT_REGION_FILTER);
    setDraftSortBy(DEFAULT_SORT);
    setSearch(DEFAULT_SEARCH);
    setPriceFilter(DEFAULT_PRICE_FILTER);
    setRegionFilter(DEFAULT_REGION_FILTER);
    setSortBy(DEFAULT_SORT);
  }

  return (
    <>
      <section className="hidden md:sticky md:top-[68px] md:z-30 md:block md:rounded-xl md:border md:border-black/8 md:bg-[#F2F7F3]/92 md:p-4 md:backdrop-blur-md dark:md:border-white/10 dark:md:bg-white/5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Ara
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kurum veya proje ara…"
              className="h-10 w-full rounded-md bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Fiyat
            </span>
            <select
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value)}
              className="h-10 w-full rounded-md bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
            >
              <option value="all">Tüm fiyatlar</option>
              <option value="0-7000">₺0 – ₺7.000</option>
              <option value="7000-12000">₺7.001 – ₺12.000</option>
              <option value="12000+">₺12.000+</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Bölge
            </span>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="h-10 w-full rounded-md bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
            >
              <option value="all">Tümü</option>
              <option value="yurt-ici">Yurt içi</option>
              <option value="yurt-disi">Yurt dışı</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Sırala
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortType)}
              className="h-10 w-full rounded-md bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
            >
              <option value="price">En uygun fiyat</option>
              <option value="popular">En popüler</option>
              <option value="az">A–Z</option>
            </select>
          </label>
        </div>
      </section>

      <section className="md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openMobileSheet("filter")}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-black/8 bg-[#F2F7F3] px-4 text-sm font-semibold text-[#1F2937] dark:border-white/12 dark:bg-[#0F1A17] dark:text-[#E5E7EB]"
          >
            Filtrele
          </button>
          <button
            type="button"
            onClick={() => openMobileSheet("sort")}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-black/8 bg-[#F2F7F3] px-4 text-sm font-semibold text-[#1F2937] dark:border-white/12 dark:bg-[#0F1A17] dark:text-[#E5E7EB]"
          >
            Sırala
          </button>
        </div>
        <p className="mt-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          {activeFilterSummary}
        </p>
      </section>

      <section className="mt-5 space-y-3 sm:space-y-4">
        {filteredGroups.map((group, index) => {
          const isOpen = openOrganization === group.organization.slug;
          const selectedCount = selectedCountByOrg[group.organization.slug] ?? 0;
          const pricePreview = pricePreviewByOrg[group.organization.slug];
          const isExpanded = expandedOrg[group.organization.slug] ?? false;
          const visibleProjects = isExpanded ? group.projects : group.projects.slice(0, 2);

          return (
            <section
              key={group.organization.slug}
              className={`rounded-xl px-2 py-1 transition-colors ${isOpen ? "bg-black/[0.02] dark:bg-white/5" : "bg-transparent"
                }`}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenOrganization((current) =>
                    current === group.organization.slug ? "" : group.organization.slug,
                  )
                }
                aria-expanded={isOpen}
                aria-label={
                  isOpen ? common.labels.collapseOrganization : common.labels.expandOrganization
                }
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-200 ${isOpen
                  ? "bg-black/[0.03] dark:bg-white/[0.07]"
                  : "hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                  }`}
              >
                <div>
                  <h2 className="text-lg font-semibold text-[#1F2937] dark:text-[#E5E7EB] sm:text-xl">
                    {group.organization.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF] sm:text-sm">
                    {group.projects.length} {common.labels.optionCountSuffix}
                    {pricePreview ? ` · ${pricePreview}` : ""}
                    {selectedCount > 0 ? ` · ${selectedCount} seçildi` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] transition-transform duration-300 dark:text-[#9CA3AF] ${isOpen ? "rotate-180" : "rotate-0"
                    }`}
                >
                  <ChevronIcon />
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="grid grid-cols-1 gap-6 pb-4 pt-2 md:grid-cols-2">
                    {visibleProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        selected={selectedIds.includes(project.id)}
                        onToggle={toggleProject}
                        recommended={recommendedProjectIds[group.organization.slug] === project.id}
                      />
                    ))}
                  </div>

                  {group.projects.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(group.organization.slug)}
                      className="mb-3 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      {isExpanded ? "Daha az göster" : "+ Daha fazla göster"}
                    </button>
                  ) : null}
                </div>
              </div>

              {index < filteredGroups.length - 1 ? (
                <div className="mx-2 mt-2 border-b-2 border-black/10 dark:border-white/20" />
              ) : null}
            </section>
          );
        })}
      </section>

      {selectedProjects.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 px-4 py-3 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-[0_-10px_24px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
            <p className="min-w-0 flex-1 text-sm font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
              {selectedProjects.length} proje seçildi
            </p>
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300"
            >
              Karşılaştır
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-semibold text-[#6B7280] transition hover:text-[#1F2937] dark:border-white/15 dark:bg-white/10 dark:text-[#E5E7EB] dark:hover:bg-white/15 dark:hover:text-white"
            >
              {common.buttons.clear}
            </button>
          </div>
        </div>
      ) : null}

      {isCompareOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#FAFBF9] shadow-2xl dark:bg-[#0F1A17] dark:ring-1 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10">
              <h3 className="text-base font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                Seçilen Projeler Karşılaştırması
              </h3>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#6B7280] transition hover:bg-black/5 hover:text-[#1F2937] dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-[#E5E7EB]"
                aria-label={common.buttons.close}
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
              <ComparisonTable projects={selectedProjects} onRemove={removeProject} />
            </div>
          </div>
        </div>
      ) : null}

      {isMobileFilterOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-[#F2F7F3] p-4 shadow-2xl dark:bg-[#12201C] dark:ring-1 dark:ring-white/12"
            style={{ maxHeight: "82vh", overflowY: "auto" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                {mobileSheetMode === "filter" ? "Filtrele" : "Sırala"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#6B7280] dark:text-[#9CA3AF]"
                aria-label={common.buttons.close}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Ara
                </span>
                <input
                  type="text"
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Kurum veya proje ara…"
                  className="h-10 w-full rounded-md border border-black/8 bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Fiyat
                </span>
                <select
                  value={draftPriceFilter}
                  onChange={(event) => setDraftPriceFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-black/8 bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
                >
                  <option value="all">Tüm fiyatlar</option>
                  <option value="0-7000">₺0 – ₺7.000</option>
                  <option value="7000-12000">₺7.001 – ₺12.000</option>
                  <option value="12000+">₺12.000+</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Bölge
                </span>
                <select
                  value={draftRegionFilter}
                  onChange={(event) => setDraftRegionFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-black/8 bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
                >
                  <option value="all">Tümü</option>
                  <option value="yurt-ici">Yurt içi</option>
                  <option value="yurt-disi">Yurt dışı</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Sırala
                </span>
                <select
                  value={draftSortBy}
                  onChange={(event) => setDraftSortBy(event.target.value as SortType)}
                  className="h-10 w-full rounded-md border border-black/8 bg-[#EAF1EC] px-3 text-sm text-[#1F2937] outline-none transition focus:border-emerald-500 dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
                >
                  <option value="price">En uygun fiyat</option>
                  <option value="popular">En popüler</option>
                  <option value="az">A–Z</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={clearMobileFilters}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-black/8 bg-[#EAF1EC] px-4 text-sm font-semibold text-[#6B7280] dark:border-white/12 dark:bg-[#0C1512] dark:text-[#E5E7EB]"
              >
                Temizle
              </button>
              <button
                type="button"
                onClick={applyMobileFilters}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
