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
  initialCategory?: string;
  initialRegion?: string;
  initialSearch?: string;
};

type SortType = "price" | "popular" | "az";
type PriceBounds = { min: number; max: number };

const DEFAULT_SEARCH = "";
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

function getProjectRegions(project: KurbanProjectWithOrganization) {
  return project.regions ?? (project.region ? [project.region] : []);
}

function getPositivePrice(project: KurbanProjectWithOrganization) {
  return project.price > 0 ? project.price : null;
}

function clampRangeToBounds(range: PriceBounds, bounds: PriceBounds): PriceBounds {
  const min = Math.max(bounds.min, Math.min(range.min, bounds.max));
  const max = Math.min(bounds.max, Math.max(range.max, bounds.min));
  if (min > max) return { ...bounds };
  return { min, max };
}

function areRangesEqual(a: PriceBounds | null, b: PriceBounds | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.min === b.min && a.max === b.max;
}

function getPriceHistogram(prices: number[], bounds: PriceBounds | null, preferredBins = 24) {
  if (!bounds || !prices.length) return [];
  const binCount = Math.max(8, Math.min(preferredBins, prices.length));
  const span = Math.max(bounds.max - bounds.min, 1);
  const bins = Array.from({ length: binCount }, (_, index) => ({
    index,
    count: 0,
    start: bounds.min + (span * index) / binCount,
    end: bounds.min + (span * (index + 1)) / binCount,
  }));

  prices.forEach((price) => {
    const ratio = (price - bounds.min) / span;
    const rawIndex = Math.floor(ratio * binCount);
    const safeIndex = Math.max(0, Math.min(binCount - 1, rawIndex));
    bins[safeIndex].count += 1;
  });

  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  return bins.map((bin) => ({
    ...bin,
    intensity: bin.count / maxCount,
  }));
}

export function KurbanComparisonClient({
  groups,
  projects,
  categories,
  regions,
  initialCategory,
  initialRegion,
  initialSearch,
}: KurbanComparisonClientProps) {
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastAppliedInitialCategoryRef = useRef<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    cleanCategoryLabel(initialCategory ?? "") || DEFAULT_CATEGORY,
  );
  const [openOrganization, setOpenOrganization] = useState(
    groups[0]?.organization.slug ?? "",
  );

  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceBounds | null>(null);
  const [regionFilter, setRegionFilter] = useState(DEFAULT_REGION_FILTER);
  const [sortBy, setSortBy] = useState<SortType>(DEFAULT_SORT);

  const [expandedOrg, setExpandedOrg] = useState<Record<string, boolean>>({});

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSheetMode, setMobileSheetMode] = useState<"filter" | "sort">(
    "filter",
  );
  const [draftSearch, setDraftSearch] = useState(DEFAULT_SEARCH);
  const [draftPriceRange, setDraftPriceRange] = useState<PriceBounds | null>(null);
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

  useEffect(() => {
    const cleanedInitial = cleanCategoryLabel(initialCategory ?? "");
    if (!cleanedInitial) return;

    const normalizedInitial = normalizeText(cleanedInitial);
    if (lastAppliedInitialCategoryRef.current === normalizedInitial) return;
    lastAppliedInitialCategoryRef.current = normalizedInitial;

    if (normalizeText(cleanedInitial) !== normalizeText(selectedCategory)) {
      setSelectedCategory(cleanedInitial);
      setSearch(DEFAULT_SEARCH);
      setSelectedPriceRange(null);
      setRegionFilter(DEFAULT_REGION_FILTER);
      setSortBy(DEFAULT_SORT);
      setDraftSearch(DEFAULT_SEARCH);
      setDraftPriceRange(null);
      setDraftRegionFilter(DEFAULT_REGION_FILTER);
      setDraftSortBy(DEFAULT_SORT);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (!initialRegion) return;
    const regionExists = regions.some(
      (region) => normalizeText(region.name) === normalizeText(initialRegion),
    );
    if (!regionExists) return;
    setRegionFilter(initialRegion);
    setDraftRegionFilter(initialRegion);
  }, [initialRegion, regions]);

  useEffect(() => {
    if (!initialSearch) return;
    setSearch(initialSearch);
    setDraftSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const selectedButton = categoryButtonRefs.current[selectedCategory];
    if (!selectedButton) return;
    selectedButton.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedCategory, categoryTabs]);

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

  const baseFilteredGroups = useMemo(() => {
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
            if (regionFilter === "all") {
              return true;
            }

            const normalizedRegionFilter = normalizeText(regionFilter);
            const projectRegions = (project.regions ?? (project.region ? [project.region] : []))
              .map((region) => normalizeText(region));
            return projectRegions.includes(normalizedRegionFilter);
          })
          .sort((a, b) => {
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
  }, [groups, regionFilter, search, selectedCategory, sortBy]);

  const availablePriceBounds = useMemo<PriceBounds | null>(() => {
    const prices = baseFilteredGroups
      .flatMap((group) => group.projects)
      .map(getPositivePrice)
      .filter((price): price is number => price !== null);

    if (!prices.length) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [baseFilteredGroups]);

  const priceDistribution = useMemo(() => {
    const prices = baseFilteredGroups
      .flatMap((group) => group.projects)
      .map(getPositivePrice)
      .filter((price): price is number => price !== null);
    return getPriceHistogram(prices, availablePriceBounds, 22);
  }, [availablePriceBounds, baseFilteredGroups]);

  useEffect(() => {
    if (!availablePriceBounds) {
      if (selectedPriceRange !== null) {
        setSelectedPriceRange(null);
      }
      if (draftPriceRange !== null) {
        setDraftPriceRange(null);
      }
      return;
    }

    if (selectedPriceRange) {
      const clamped = clampRangeToBounds(selectedPriceRange, availablePriceBounds);
      if (!areRangesEqual(clamped, selectedPriceRange)) {
        setSelectedPriceRange(clamped);
      }
    }

    if (draftPriceRange) {
      const clampedDraft = clampRangeToBounds(draftPriceRange, availablePriceBounds);
      if (!areRangesEqual(clampedDraft, draftPriceRange)) {
        setDraftPriceRange(clampedDraft);
      }
    }
  }, [availablePriceBounds, draftPriceRange, selectedPriceRange]);

  const effectivePriceRange = useMemo<PriceBounds | null>(() => {
    if (!availablePriceBounds) return null;
    if (!selectedPriceRange) return availablePriceBounds;
    return clampRangeToBounds(selectedPriceRange, availablePriceBounds);
  }, [availablePriceBounds, selectedPriceRange]);

  const filteredGroups = useMemo(() => {
    return baseFilteredGroups
      .map((group) => {
        const filteredProjects = group.projects
          .filter((project) => {
            if (!effectivePriceRange) return true;
            const price = getPositivePrice(project);
            if (price === null) return false;
            return price >= effectivePriceRange.min && price <= effectivePriceRange.max;
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
  }, [baseFilteredGroups, effectivePriceRange, sortBy]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (regionFilter !== "all") {
      parts.push(regionFilter);
    }

    if (effectivePriceRange && availablePriceBounds) {
      const isFullRange =
        effectivePriceRange.min === availablePriceBounds.min &&
        effectivePriceRange.max === availablePriceBounds.max;
      if (!isFullRange) {
        parts.push(`${formatPrice(effectivePriceRange.min)}–${formatPrice(effectivePriceRange.max)}`);
      }
    }

    if (search.trim()) {
      parts.push(`"${search.trim()}"`);
    }

    return parts.length ? parts.join(" • ") : "Tüm projeler";
  }, [availablePriceBounds, effectivePriceRange, regionFilter, search]);

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
    setDraftPriceRange(selectedPriceRange);
    setDraftRegionFilter(regionFilter);
    setDraftSortBy(sortBy);
    setIsMobileFilterOpen(true);
  }

  function applyMobileFilters() {
    setSearch(draftSearch);
    setSelectedPriceRange(draftPriceRange);
    setRegionFilter(draftRegionFilter);
    setSortBy(draftSortBy);
    setIsMobileFilterOpen(false);
  }

  function clearMobileFilters() {
    setDraftSearch(DEFAULT_SEARCH);
    setDraftPriceRange(null);
    setDraftRegionFilter(DEFAULT_REGION_FILTER);
    setDraftSortBy(DEFAULT_SORT);
    setSearch(DEFAULT_SEARCH);
    setSelectedPriceRange(null);
    setRegionFilter(DEFAULT_REGION_FILTER);
    setSortBy(DEFAULT_SORT);
  }

  function updateDesktopPriceMin(value: number) {
    if (!availablePriceBounds) return;
    const current = effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: value, max: Math.max(value, current.max) },
      availablePriceBounds,
    );
    setSelectedPriceRange(nextRange);
  }

  function updateDesktopPriceMax(value: number) {
    if (!availablePriceBounds) return;
    const current = effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: Math.min(current.min, value), max: value },
      availablePriceBounds,
    );
    setSelectedPriceRange(nextRange);
  }

  function updateDraftPriceMin(value: number) {
    if (!availablePriceBounds) return;
    const baseRange = draftPriceRange ?? effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: value, max: Math.max(value, baseRange.max) },
      availablePriceBounds,
    );
    setDraftPriceRange(nextRange);
  }

  function updateDraftPriceMax(value: number) {
    if (!availablePriceBounds) return;
    const baseRange = draftPriceRange ?? effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: Math.min(baseRange.min, value), max: value },
      availablePriceBounds,
    );
    setDraftPriceRange(nextRange);
  }

  function handleCategoryChange(category: string) {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
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
                    ref={(el) => {
                      categoryButtonRefs.current[tab] = el;
                    }}
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
                Tutar
              </span>
              <PriceRangeControl
                bounds={availablePriceBounds}
                value={effectivePriceRange}
                histogram={priceDistribution}
                onMinChange={updateDesktopPriceMin}
                onMaxChange={updateDesktopPriceMax}
                floatingPanel
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Bölge
              </span>
              <select
                value={regionFilter}
                onChange={(event) => {
                  setRegionFilter(event.target.value);
                  event.currentTarget.blur();
                }}
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
                onChange={(event) => {
                  setSortBy(event.target.value as SortType);
                  event.currentTarget.blur();
                }}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              >
                <option value="price">En uygun tutar</option>
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
                  Tutar
                </span>
                <PriceRangeControl
                  bounds={availablePriceBounds}
                  value={draftPriceRange ?? effectivePriceRange}
                  histogram={priceDistribution}
                  onMinChange={updateDraftPriceMin}
                  onMaxChange={updateDraftPriceMax}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">
                  Bölge
                </span>
                <select
                  value={draftRegionFilter}
                  onChange={(event) => {
                    setDraftRegionFilter(event.target.value);
                    event.currentTarget.blur();
                  }}
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
                  onChange={(event) => {
                    setDraftSortBy(event.target.value as SortType);
                    event.currentTarget.blur();
                  }}
                  className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                >
                  <option value="price">En uygun tutar</option>
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

function PriceRangeControl({
  bounds,
  value,
  histogram,
  onMinChange,
  onMaxChange,
  defaultOpen = false,
  floatingPanel = false,
}: {
  bounds: PriceBounds | null;
  value: PriceBounds | null;
  histogram: Array<{ index: number; count: number; start: number; end: number; intensity: number }>;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  defaultOpen?: boolean;
  floatingPanel?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!bounds) {
    return (
      <div className="rounded-xl border border-divider-softLight bg-surface-pageLight/80 px-3 py-3">
        <p className="text-xs text-text-secondary">Uygun tutar verisi bulunamadı.</p>
      </div>
    );
  }

  const safeValue = value ? clampRangeToBounds(value, bounds) : bounds;
  const span = Math.max(bounds.max - bounds.min, 1);
  const minPercent = ((safeValue.min - bounds.min) / span) * 100;
  const maxPercent = ((safeValue.max - bounds.min) / span) * 100;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:border-divider-softLight/90"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-sm font-semibold leading-tight text-text-primary">
            {formatPrice(safeValue.min)} - {formatPrice(safeValue.max)}
          </p>
        </div>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <ChevronIcon />
        </span>
      </button>

      {isOpen ? (
        <div
          className={`${
            floatingPanel
              ? "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-divider-softLight bg-surface-pageLight p-3 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
              : "mt-2 rounded-xl border border-divider-softLight bg-surface-pageLight p-3 shadow-[0_8px_24px_rgba(15,23,42,0.1)]"
          }`}
        >
          <p className="mb-2 text-[11px] text-text-secondary">
            Aralık: {formatPrice(bounds.min)} - {formatPrice(bounds.max)}
          </p>
          <div className="mb-2 flex h-11 items-end gap-0.5 overflow-hidden rounded-md border border-divider-softLight/50 bg-surface-categoryLight/40 px-1 py-1">
            {histogram.map((bin) => {
              const isActive = bin.end >= safeValue.min && bin.start <= safeValue.max;
              const height = Math.max(8, Math.round(bin.intensity * 100));
              return (
                <span
                  key={bin.index}
                  className={`block flex-1 rounded-sm transition-all duration-300 ${
                    isActive ? "bg-brand-primary/40" : "bg-brand-primary/15"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          <div className="relative h-10">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-divider-softLight/80" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-primary/50 transition-all duration-300"
              style={{
                left: `${minPercent}%`,
                width: `${Math.max(maxPercent - minPercent, 0)}%`,
              }}
            />

            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={safeValue.min}
              onChange={(event) => onMinChange(Number(event.target.value))}
              className="pointer-events-none absolute inset-0 z-20 h-10 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:shadow-md"
              aria-label="Minimum tutar"
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={safeValue.max}
              onChange={(event) => onMaxChange(Number(event.target.value))}
              className="pointer-events-none absolute inset-0 z-30 h-10 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:shadow-md"
              aria-label="Maksimum tutar"
            />
          </div>
        </div>
      ) : null}
    </div>
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
