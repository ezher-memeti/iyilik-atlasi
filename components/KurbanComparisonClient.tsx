"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProjectCard } from "@/components/ProjectCard";
import common from "@/content/common.json";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/donationModels";

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
  categories: Array<{ id: number; name: string }>;
  regions: Array<{ id: number; name: string }>;
};

type SortType = "price" | "popular" | "az";

const DEFAULT_SEARCH = "";
const DEFAULT_PRICE_FILTER = "all";
const DEFAULT_REGION_FILTER = "all";
const DEFAULT_SORT: SortType = "popular";
const DEFAULT_CATEGORY = "Kurban";

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

function cleanCategoryLabel(value: string) {
  const trimmed = value.trim();
  let index = 0;
  while (index < trimmed.length) {
    const ch = trimmed.charAt(index);
    if (/[A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(ch)) break;
    index += 1;
  }
  return trimmed.slice(index).trim();
}

export function KurbanComparisonClient({
  groups,
  projects,
  categories,
  regions,
}: KurbanComparisonClientProps) {
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
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
  const [showTabArrows, setShowTabArrows] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categoryTabs = useMemo(() => {
    const fetched = categories.length
      ? categories.map((category) => cleanCategoryLabel(category.name))
      : [DEFAULT_CATEGORY];

    const unique = Array.from(new Set(fetched.filter(Boolean)));

    if (!unique.some((name) => normalizeText(name) === normalizeText(DEFAULT_CATEGORY))) {
      return [DEFAULT_CATEGORY, ...unique];
    }

    return unique;
  }, [categories]);

  useEffect(() => {
    const exists = categoryTabs.some(
      (tab) => normalizeText(tab) === normalizeText(selectedCategory),
    );

    if (!exists && categoryTabs.length > 0) {
      setSelectedCategory(categoryTabs[0]);
    }
  }, [categoryTabs, selectedCategory]);

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
    const selectedCategoryNormalized = normalizeText(selectedCategory);

    return groups
      .map((group) => {
        const filteredProjects = group.projects
          .filter((project) => {
            const categoryNames = project.categories.map((category) =>
              normalizeText(category.name),
            );
            const normalizedTitle = normalizeText(project.title);
            const normalizedDescription = normalizeText(project.description);

            if (selectedCategoryNormalized === normalizeText(DEFAULT_CATEGORY)) {
              if (categoryNames.length === 0) {
                return true;
              }
              return (
                categoryNames.some((name) => name.includes("kurban")) ||
                normalizedTitle.includes("kurban") ||
                normalizedDescription.includes("kurban")
              );
            }

            if (categoryNames.length === 0) {
              return (
                normalizedTitle.includes(selectedCategoryNormalized) ||
                normalizedDescription.includes(selectedCategoryNormalized)
              );
            }

            return categoryNames.some((name) => name.includes(selectedCategoryNormalized));
          })
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

            const projectRegion = project.region ? normalizeText(project.region) : "";
            return projectRegion === normalizeText(regionFilter);
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
  }, [groups, priceFilter, regionFilter, search, selectedCategory, sortBy]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (regionFilter !== "all") {
      parts.push(regionFilter);
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

  const updateTabScrollState = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setShowTabArrows(hasOverflow);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateTabScrollState();
    const el = tabsScrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateTabScrollState, { passive: true });
    window.addEventListener("resize", updateTabScrollState);

    return () => {
      el.removeEventListener("scroll", updateTabScrollState);
      window.removeEventListener("resize", updateTabScrollState);
    };
  }, [updateTabScrollState, categoryTabs]);

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

  function handleCategoryChange(category: string) {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
    setSearch(DEFAULT_SEARCH);
    setPriceFilter(DEFAULT_PRICE_FILTER);
    setRegionFilter(DEFAULT_REGION_FILTER);
    setSortBy(DEFAULT_SORT);
    setDraftSearch(DEFAULT_SEARCH);
    setDraftPriceFilter(DEFAULT_PRICE_FILTER);
    setDraftRegionFilter(DEFAULT_REGION_FILTER);
    setDraftSortBy(DEFAULT_SORT);
  }

  return (
    <>
      <section className="rounded-2xl border border-divider-softLight bg-white/80 p-4 backdrop-blur-sm sm:p-6">
        <div className="relative md:px-10">
          <div
            ref={tabsScrollRef}
            className="overflow-x-auto border-b border-divider-softLight pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max min-w-full gap-6 pr-4 sm:gap-8 sm:pr-6">
              {categoryTabs.map((tab) => {
                const isActive = tab === selectedCategory;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleCategoryChange(tab)}
                    className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "border-brand-primary text-brand-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tab}
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

        <div className="mt-4 hidden md:block">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Ara
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Kurum veya proje ara…"
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Fiyat
              </span>
              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              >
                <option value="all">Tüm fiyatlar</option>
                <option value="0-7000">₺0 – ₺7.000</option>
                <option value="7000-12000">₺7.001 – ₺12.000</option>
                <option value="12000+">₺12.000+</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Bölge
              </span>
              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              >
                <option value="all">Tümü</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Sırala
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortType)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              >
                <option value="price">En uygun fiyat</option>
                <option value="popular">En popüler</option>
                <option value="az">A–Z</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openMobileSheet("filter")}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-categoryLight px-4 text-sm font-semibold text-text-primary"
            >
              Filtrele
            </button>
            <button
              type="button"
              onClick={() => openMobileSheet("sort")}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-categoryLight px-4 text-sm font-semibold text-text-primary"
            >
              Sırala
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {activeFilterSummary}
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-3 sm:space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-divider-softLight bg-surface-pageLight/70 px-4 py-8 text-center text-sm text-text-secondary">
            Seçilen kategori için uygun bağış seçeneği bulunamadı.
          </div>
        ) : null}
        {filteredGroups.map((group, index) => {
          const isOpen = openOrganization === group.organization.slug;
          const selectedCount = selectedCountByOrg[group.organization.slug] ?? 0;
          const pricePreview = pricePreviewByOrg[group.organization.slug];
          const isExpanded = expandedOrg[group.organization.slug] ?? false;
          const visibleProjects = isExpanded ? group.projects : group.projects.slice(0, 2);

          return (
            <section
              key={group.organization.slug}
              className={`rounded-xl px-2 py-1 transition-colors ${isOpen ? "bg-surface-categoryLight/50" : "bg-transparent"
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
                  ? "bg-surface-pageLight"
                  : "hover:bg-surface-pageLight"
                  }`}
              >
                <div>
                  <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
                    {group.organization.name}
                  </h2>
                  <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                    {group.projects.length} {common.labels.optionCountSuffix}
                    {pricePreview ? ` · ${pricePreview}` : ""}
                    {selectedCount > 0 ? ` · ${selectedCount} seçildi` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"
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
                      className="mb-3 inline-flex items-center text-sm font-semibold text-brand-primary transition hover:text-brand-secondary"
                    >
                      {isExpanded ? "Daha az göster" : "+ Daha fazla göster"}
                    </button>
                  ) : null}
                </div>
              </div>

              {index < filteredGroups.length - 1 ? (
                <div className="mx-2 mt-2 border-b border-divider-softLight" />
              ) : null}
            </section>
          );
        })}
      </section>

      {selectedProjects.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-divider-softLight bg-surface-pageLight/95 px-4 py-3 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
            <p className="min-w-0 flex-1 text-sm font-semibold text-text-primary">
              {selectedProjects.length} proje seçildi
            </p>
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary"
            >
              Karşılaştır
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              {common.buttons.clear}
            </button>
          </div>
        </div>
      ) : null}

      {isCompareOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-surface-pageLight shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider-softLight px-5 py-4">
              <h3 className="text-base font-semibold text-text-primary">
                Seçilen Projeler Karşılaştırması
              </h3>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                aria-label={common.buttons.close}
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
              <ComparisonTable projects={selectedProjects} onRemove={removeProject} />
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
      ) : null}

      {isMobileFilterOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface-categoryLight p-4 shadow-2xl"
            style={{ maxHeight: "82vh", overflowY: "auto" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">
                {mobileSheetMode === "filter" ? "Filtrele" : "Sırala"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary"
                aria-label={common.buttons.close}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Ara
                </span>
                <input
                  type="text"
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Kurum veya proje ara…"
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Fiyat
                </span>
                <select
                  value={draftPriceFilter}
                  onChange={(event) => setDraftPriceFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                >
                  <option value="all">Tüm fiyatlar</option>
                  <option value="0-7000">₺0 – ₺7.000</option>
                  <option value="7000-12000">₺7.001 – ₺12.000</option>
                  <option value="12000+">₺12.000+</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Bölge
                </span>
                <select
                  value={draftRegionFilter}
                  onChange={(event) => setDraftRegionFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                >
                  <option value="all">Tümü</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Sırala
                </span>
                <select
                  value={draftSortBy}
                  onChange={(event) => setDraftSortBy(event.target.value as SortType)}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
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
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-4 text-sm font-semibold text-text-secondary"
              >
                Temizle
              </button>
              <button
                type="button"
                onClick={applyMobileFilters}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white"
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
