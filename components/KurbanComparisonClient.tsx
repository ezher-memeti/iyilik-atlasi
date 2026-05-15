"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProjectCard } from "@/components/ProjectCard";
import common from "@/content/common.json";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/donationModels";

type KurbanComparisonClientProps = {
  projects: KurbanProjectWithOrganization[];
  categories: Array<{ id: number; name: string }>;
  regions: Array<{ id: number; name: string }>;
  initialCategory?: string;
  initialRegion?: string;
  initialSearch?: string;
  initialProjectId?: string;
};

type SortType = "price" | "popular" | "az" | "ngo";
type PriceBounds = { min: number; max: number };

const DEFAULT_SEARCH = "";
const DEFAULT_REGION_FILTER: string[] = [];
const DEFAULT_NGO_FILTER: string[] = [];
const DEFAULT_SORT: SortType = "popular";
const DEFAULT_CATEGORY = "Kurban";
const PROJECTS_PER_PAGE = 24;

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
  return project.price >= 0 ? project.price : null;
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

function formatDiscoveryCount(count: number) {
  return new Intl.NumberFormat("tr-TR").format(count);
}

function includesText(value: string, query: string) {
  const normalizedValue = value.toLocaleLowerCase("tr-TR");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  if (!normalizedQuery) return true;
  return normalizedValue.includes(normalizedQuery);
}

function matchesCategoryAndSearch(
  project: KurbanProjectWithOrganization,
  selectedCategory: string,
  search: string,
) {
  const selectedCategoryNormalized = normalizeText(selectedCategory);
  const query = search.trim().toLocaleLowerCase("tr-TR");
  const categoryNames = project.categories.map((category) => normalizeText(category.name));
  const normalizedTitle = normalizeText(project.title);
  const normalizedDescription = normalizeText(project.description);

  const categoryMatch =
    selectedCategoryNormalized === normalizeText(DEFAULT_CATEGORY)
      ? categoryNames.length === 0 ||
      categoryNames.some((name) => name.includes("kurban")) ||
      normalizedTitle.includes("kurban") ||
      normalizedDescription.includes("kurban")
      : categoryNames.length === 0
        ? normalizedTitle.includes(selectedCategoryNormalized) ||
        normalizedDescription.includes(selectedCategoryNormalized)
        : categoryNames.some((name) => name.includes(selectedCategoryNormalized));

  if (!categoryMatch) return false;
  if (!query) return true;

  return (
    project.organization.name.toLocaleLowerCase("tr-TR").includes(query) ||
    project.title.toLocaleLowerCase("tr-TR").includes(query) ||
    project.description.toLocaleLowerCase("tr-TR").includes(query)
  );
}

function matchesRegion(project: KurbanProjectWithOrganization, regionFilter: string[]) {
  if (regionFilter.length === 0) return true;
  const normalizedRegionFilters = new Set(regionFilter.map((region) => normalizeText(region)));
  const projectRegions = getProjectRegions(project).map((region) => normalizeText(region));
  return projectRegions.some((region) => normalizedRegionFilters.has(region));
}

function matchesNgo(project: KurbanProjectWithOrganization, ngoFilter: string[]) {
  if (ngoFilter.length === 0) return true;
  const normalizedNgoFilters = new Set(ngoFilter.map((ngo) => normalizeText(ngo)));
  return normalizedNgoFilters.has(normalizeText(project.organization.name));
}

function matchesPriceRange(project: KurbanProjectWithOrganization, effectivePriceRange: PriceBounds | null) {
  if (!effectivePriceRange) return true;
  const price = getPositivePrice(project);
  if (price === null) return false;
  return price >= effectivePriceRange.min && price <= effectivePriceRange.max;
}

export function KurbanComparisonClient({
  projects,
  categories,
  regions,
  initialCategory,
  initialRegion,
  initialSearch,
  initialProjectId,
}: KurbanComparisonClientProps) {
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastAppliedInitialCategoryRef = useRef<string>("");
  const hasHandledInitialProjectRef = useRef(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    cleanCategoryLabel(initialCategory ?? "") || DEFAULT_CATEGORY,
  );

  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceBounds | null>(null);
  const [isPriceSetByUser, setIsPriceSetByUser] = useState(false);
  const [userPreferredPriceRange, setUserPreferredPriceRange] = useState<PriceBounds | null>(null);
  const [regionFilter, setRegionFilter] = useState(DEFAULT_REGION_FILTER);
  const [ngoFilter, setNgoFilter] = useState(DEFAULT_NGO_FILTER);
  const [regionSearch, setRegionSearch] = useState("");
  const [ngoSearch, setNgoSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>(DEFAULT_SORT);
  const [isRegionCardOpen, setIsRegionCardOpen] = useState(false);
  const [isNgoCardOpen, setIsNgoCardOpen] = useState(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(DEFAULT_SEARCH);
  const [draftPriceRange, setDraftPriceRange] = useState<PriceBounds | null>(null);
  const [isDraftPriceSetByUser, setIsDraftPriceSetByUser] = useState(false);
  const [draftUserPreferredPriceRange, setDraftUserPreferredPriceRange] = useState<PriceBounds | null>(
    null,
  );
  const [draftRegionFilter, setDraftRegionFilter] = useState(DEFAULT_REGION_FILTER);
  const [draftRegionSearch, setDraftRegionSearch] = useState("");
  const [draftNgoFilter, setDraftNgoFilter] = useState(DEFAULT_NGO_FILTER);
  const [draftNgoSearch, setDraftNgoSearch] = useState("");
  const [isMobileRegionOpen, setIsMobileRegionOpen] = useState(false);
  const [isMobileNgoOpen, setIsMobileNgoOpen] = useState(false);
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

  const selectedSortLabel = useMemo(() => {
    switch (sortBy) {
      case "price":
        return "En uygun tutar";
      case "az":
        return "A-Z";
      case "ngo":
        return "Kurumlara göre sırala";
      case "popular":
      default:
        return "Varsayılan";
    }
  }, [sortBy]);

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
      setNgoFilter(DEFAULT_NGO_FILTER);
      setNgoSearch("");
      setIsPriceSetByUser(false);
      setUserPreferredPriceRange(null);
      setSortBy(DEFAULT_SORT);
      setDraftSearch(DEFAULT_SEARCH);
      setDraftPriceRange(null);
      setIsDraftPriceSetByUser(false);
      setDraftUserPreferredPriceRange(null);
      setDraftRegionFilter(DEFAULT_REGION_FILTER);
      setDraftNgoFilter(DEFAULT_NGO_FILTER);
      setDraftNgoSearch("");
    }
  }, [initialCategory]);

  useEffect(() => {
    if (!initialRegion) return;
    const regionExists = regions.some(
      (region) => normalizeText(region.name) === normalizeText(initialRegion),
    );
    if (!regionExists) return;
    setRegionFilter([initialRegion]);
    setDraftRegionFilter([initialRegion]);
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

  const ngoOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.organization.name)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "tr")),
    [projects],
  );

  const projectsAfterCategorySearch = useMemo(
    () =>
      projects.filter((project) => matchesCategoryAndSearch(project, selectedCategory, search)),
    [projects, search, selectedCategory],
  );

  const baseFilteredProjects = useMemo(
    () =>
      projectsAfterCategorySearch
        .filter((project) => matchesRegion(project, regionFilter))
        .filter((project) => matchesNgo(project, ngoFilter)),
    [ngoFilter, projectsAfterCategorySearch, regionFilter],
  );

  const availablePriceBounds = useMemo<PriceBounds | null>(() => {
    const prices = baseFilteredProjects
      .map(getPositivePrice)
      .filter((price): price is number => price !== null);

    if (!prices.length) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [baseFilteredProjects]);

  const priceDistribution = useMemo(() => {
    const prices = baseFilteredProjects
      .map(getPositivePrice)
      .filter((price): price is number => price !== null);
    return getPriceHistogram(prices, availablePriceBounds, 22);
  }, [availablePriceBounds, baseFilteredProjects]);

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

    if (isPriceSetByUser && userPreferredPriceRange) {
      const restored = clampRangeToBounds(userPreferredPriceRange, availablePriceBounds);
      if (!areRangesEqual(restored, selectedPriceRange)) {
        setSelectedPriceRange(restored);
      }
    } else if (selectedPriceRange) {
      const clamped = clampRangeToBounds(selectedPriceRange, availablePriceBounds);
      if (!areRangesEqual(clamped, selectedPriceRange)) {
        setSelectedPriceRange(clamped);
      }
    }

    if (isDraftPriceSetByUser && draftUserPreferredPriceRange) {
      const restoredDraft = clampRangeToBounds(draftUserPreferredPriceRange, availablePriceBounds);
      if (!areRangesEqual(restoredDraft, draftPriceRange)) {
        setDraftPriceRange(restoredDraft);
      }
    } else if (draftPriceRange) {
      const clampedDraft = clampRangeToBounds(draftPriceRange, availablePriceBounds);
      if (!areRangesEqual(clampedDraft, draftPriceRange)) {
        setDraftPriceRange(clampedDraft);
      }
    }
  }, [
    availablePriceBounds,
    draftPriceRange,
    draftUserPreferredPriceRange,
    isDraftPriceSetByUser,
    isPriceSetByUser,
    selectedPriceRange,
    userPreferredPriceRange,
  ]);

  const effectivePriceRange = useMemo<PriceBounds | null>(() => {
    if (!availablePriceBounds) return null;
    if (!selectedPriceRange) return availablePriceBounds;
    return clampRangeToBounds(selectedPriceRange, availablePriceBounds);
  }, [availablePriceBounds, selectedPriceRange]);

  const filteredProjects = useMemo(() => {
    return baseFilteredProjects
      .filter((project) => {
        return matchesPriceRange(project, effectivePriceRange);
      })
      .sort((a, b) => {
        if (sortBy === "price") {
          const aPrice = a.price >= 0 ? a.price : Number.MAX_SAFE_INTEGER;
          const bPrice = b.price >= 0 ? b.price : Number.MAX_SAFE_INTEGER;
          return aPrice - bPrice;
        }

        if (sortBy === "ngo") {
          const ngoCompare = a.organization.name.localeCompare(b.organization.name, "tr");
          if (ngoCompare !== 0) return ngoCompare;
          return a.title.localeCompare(b.title, "tr");
        }

        if (sortBy === "az") {
          return a.title.localeCompare(b.title, "tr");
        }

        return 0;
      });
  }, [baseFilteredProjects, effectivePriceRange, sortBy]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE)),
    [filteredProjects.length],
  );

  const visibleProjects = useMemo(() => {
    const from = (currentPage - 1) * PROJECTS_PER_PAGE;
    const to = from + PROJECTS_PER_PAGE;
    return filteredProjects.slice(from, to);
  }, [currentPage, filteredProjects]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (regionFilter.length > 0) {
      parts.push(regionFilter.join(", "));
    }

    if (ngoFilter.length > 0) {
      parts.push(`${ngoFilter.length} kurum`);
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
  }, [availablePriceBounds, effectivePriceRange, ngoFilter.length, regionFilter, search]);

  const resultHeader = useMemo(() => {
    const count = filteredProjects.length;
    const countText = formatDiscoveryCount(count);
    const cleanedSearch = search.trim();
    const hasSearch = cleanedSearch.length > 0;
    const hasRegion = regionFilter.length > 0;
    const hasSingleRegion = regionFilter.length === 1;
    const hasCategory = normalizeText(selectedCategory) !== normalizeText(DEFAULT_CATEGORY);
    const categoryLabel = hasCategory ? selectedCategory : "Kurban";
    const regionLabel = hasSingleRegion
      ? regionFilter[0]
      : `${regionFilter.length} bölge`;

    if (hasSearch) {
      return {
        title: `"${cleanedSearch}" için ${countText} sonuç`,
        subtitle: "Aramaya en uygun bağış projelerini inceliyorsunuz.",
      };
    }

    if (hasRegion && hasCategory) {
      return {
        title: `${regionLabel} bölgesinde ${categoryLabel} için ${countText} proje`,
        subtitle: "Bölge ve kategoriye göre eşleşen projeler listeleniyor.",
      };
    }

    if (hasCategory) {
      return {
        title: `${categoryLabel} kategorisinde ${countText} proje`,
        subtitle: "Bu kategorideki bağış seçeneklerini keşfedin.",
      };
    }

    if (hasRegion) {
      return {
        title: `${regionLabel} için ${countText} bağış seçeneği`,
        subtitle: "Seçtiğiniz bölgelerdeki projeler listeleniyor.",
      };
    }

    return {
      title: `Keşfedilecek ${countText} bağış seçeneği`,
      subtitle: "Tüm bağış projeleri arasından size uygun olanı bulun.",
    };
  }, [filteredProjects.length, regionFilter, search, selectedCategory]);

  const dynamicRegionCounts = useMemo(() => {
    const manualPriceRange = isPriceSetByUser ? effectivePriceRange : null;
    const counts = new Map<string, number>();
    projectsAfterCategorySearch
      .filter((project) => matchesNgo(project, ngoFilter))
      .filter((project) => matchesPriceRange(project, manualPriceRange))
      .forEach((project) => {
        getProjectRegions(project).forEach((region) => {
          counts.set(region, (counts.get(region) ?? 0) + 1);
        });
      });
    return counts;
  }, [effectivePriceRange, isPriceSetByUser, ngoFilter, projectsAfterCategorySearch]);

  const dynamicNgoCounts = useMemo(() => {
    const manualPriceRange = isPriceSetByUser ? effectivePriceRange : null;
    const counts = new Map<string, number>();
    projectsAfterCategorySearch
      .filter((project) => matchesRegion(project, regionFilter))
      .filter((project) => matchesPriceRange(project, manualPriceRange))
      .forEach((project) => {
        const ngo = project.organization.name;
        counts.set(ngo, (counts.get(ngo) ?? 0) + 1);
      });
    return counts;
  }, [effectivePriceRange, isPriceSetByUser, projectsAfterCategorySearch, regionFilter]);

  const visibleNgoOptions = useMemo(() => {
    const query = normalizeText(ngoSearch.trim());
    if (!query) return ngoOptions;
    return ngoOptions.filter((ngo) => normalizeText(ngo).includes(query));
  }, [ngoOptions, ngoSearch]);

  const visibleRegionOptions = useMemo(() => {
    return regions.filter((region) => includesText(region.name, regionSearch));
  }, [regionFilter, regionSearch, regions]);

  const visibleDraftNgoOptions = useMemo(() => {
    const query = normalizeText(draftNgoSearch.trim());
    if (!query) return ngoOptions;
    return ngoOptions.filter((ngo) => normalizeText(ngo).includes(query));
  }, [draftNgoSearch, ngoOptions]);

  const visibleDraftRegionOptions = useMemo(
    () => regions.filter((region) => includesText(region.name, draftRegionSearch)),
    [draftRegionSearch, regions],
  );

  const visibleRegionListedCount = useMemo(
    () =>
      visibleRegionOptions.filter((region) => (dynamicRegionCounts.get(region.name) ?? 0) > 0)
        .length,
    [dynamicRegionCounts, visibleRegionOptions],
  );

  const visibleNgoListedCount = useMemo(
    () => visibleNgoOptions.filter((ngo) => (dynamicNgoCounts.get(ngo) ?? 0) > 0).length,
    [dynamicNgoCounts, visibleNgoOptions],
  );

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

  function openMobileSheet() {
    setDraftSearch(search);
    setDraftPriceRange(selectedPriceRange);
    setIsDraftPriceSetByUser(false);
    setDraftUserPreferredPriceRange(userPreferredPriceRange);
    setDraftRegionFilter(regionFilter);
    setDraftRegionSearch("");
    setDraftNgoFilter(ngoFilter);
    setDraftNgoSearch("");
    setIsMobileRegionOpen(false);
    setIsMobileNgoOpen(false);
    setIsMobileFilterOpen(true);
  }

  function applyMobileFilters() {
    setSearch(draftSearch);
    setSelectedPriceRange(draftPriceRange);
    if (isDraftPriceSetByUser) {
      setIsPriceSetByUser(true);
      setUserPreferredPriceRange(draftUserPreferredPriceRange ?? draftPriceRange);
    }
    setRegionFilter(draftRegionFilter);
    setNgoFilter(draftNgoFilter);
    setIsMobileFilterOpen(false);
  }

  function clearMobileFilters() {
    setDraftSearch(DEFAULT_SEARCH);
    setDraftPriceRange(null);
    setIsDraftPriceSetByUser(false);
    setDraftUserPreferredPriceRange(null);
    setDraftRegionFilter([]);
    setDraftNgoFilter([]);
    setDraftNgoSearch("");
    setSearch(DEFAULT_SEARCH);
    setSelectedPriceRange(null);
    setIsPriceSetByUser(false);
    setUserPreferredPriceRange(null);
    setRegionFilter([]);
    setNgoFilter([]);
    setNgoSearch("");
    setSortBy(DEFAULT_SORT);
  }

  function toggleRegion(name: string) {
    setRegionFilter((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function toggleNgo(name: string) {
    setNgoFilter((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function toggleDraftRegion(name: string) {
    setDraftRegionFilter((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function toggleDraftNgo(name: string) {
    setDraftNgoFilter((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function updateDesktopPriceMin(value: number) {
    if (!availablePriceBounds) return;
    const current = effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: value, max: Math.max(value, current.max) },
      availablePriceBounds,
    );
    setSelectedPriceRange(nextRange);
    setIsPriceSetByUser(true);
    setUserPreferredPriceRange(nextRange);
  }

  function updateDesktopPriceMax(value: number) {
    if (!availablePriceBounds) return;
    const current = effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: Math.min(current.min, value), max: value },
      availablePriceBounds,
    );
    setSelectedPriceRange(nextRange);
    setIsPriceSetByUser(true);
    setUserPreferredPriceRange(nextRange);
  }

  function updateDraftPriceMin(value: number) {
    if (!availablePriceBounds) return;
    const baseRange = draftPriceRange ?? effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: value, max: Math.max(value, baseRange.max) },
      availablePriceBounds,
    );
    setDraftPriceRange(nextRange);
    setIsDraftPriceSetByUser(true);
    setDraftUserPreferredPriceRange(nextRange);
  }

  function updateDraftPriceMax(value: number) {
    if (!availablePriceBounds) return;
    const baseRange = draftPriceRange ?? effectivePriceRange ?? availablePriceBounds;
    const nextRange = clampRangeToBounds(
      { min: Math.min(baseRange.min, value), max: value },
      availablePriceBounds,
    );
    setDraftPriceRange(nextRange);
    setIsDraftPriceSetByUser(true);
    setDraftUserPreferredPriceRange(nextRange);
  }

  function handleCategoryChange(category: string) {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortBy, regionFilter, ngoFilter, selectedPriceRange]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!initialProjectId || hasHandledInitialProjectRef.current) return;
    const targetIndex = filteredProjects.findIndex((project) => project.id === initialProjectId);
    if (targetIndex === -1) return;

    const page = Math.floor(targetIndex / PROJECTS_PER_PAGE) + 1;
    if (page !== currentPage) {
      setCurrentPage(page);
      return;
    }

    hasHandledInitialProjectRef.current = true;
    const elementId = `project-${initialProjectId}`;
    const scrollToTarget = () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    requestAnimationFrame(scrollToTarget);
  }, [currentPage, filteredProjects, initialProjectId]);

  useEffect(() => {
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  useEffect(() => {
    if (!isPriceSetByUser) {
      setSelectedPriceRange(null);
      setDraftPriceRange(null);
    }
  }, [isPriceSetByUser, ngoFilter, regionFilter]);

  return (
    <>
      <section className="sticky top-16 z-30 rounded-2xl border border-divider-softLight bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:p-6">
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
                    className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors duration-200 ${isActive
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

        <div className="mt-1 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openMobileSheet}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-categoryLight px-4 text-sm font-semibold text-text-primary"
            >
              Filtrele
            </button>
            <label className="relative inline-flex h-10 flex-1 flex-col justify-center rounded-md border border-divider-softLight bg-surface-categoryLight px-3">
              <span className="block text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-text-secondary">
                Sırala
              </span>
              <span className="mt-0.5 block truncate pr-6 text-xs font-medium leading-none text-text-primary">
                {selectedSortLabel}
              </span>
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as SortType);
                  event.currentTarget.blur();
                }}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md bg-transparent text-transparent outline-none"
                aria-label="Sırala"
              >
                <option value="price">En uygun tutar</option>
                <option value="popular">Varsayılan</option>
                <option value="az">A–Z</option>
                <option value="ngo">Kurumlara göre sırala</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <ChevronIcon />
              </span>
            </label>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {activeFilterSummary}
          </p>
        </div>
      </section>

      <section className="mt-0.5 lg:mt-1 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-5 xl:gap-6">
        <aside className="hidden lg:sticky lg:top-40 lg:block lg:self-start">
          <div className="max-h-[calc(100vh-11rem)] space-y-4 overflow-y-auto pr-1">
            <section className="rounded-2xl border border-divider-softLight bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Keşfet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Sonuçları filtreleyin ve hızla karşılaştırın.
              </p>
              <div className="mt-4 space-y-4">
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
                    forceOpenOnDesktop
                  />
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
                    <option value="popular">Varsayılan</option>
                    <option value="az">A–Z</option>
                    <option value="ngo">Kurumlara göre sırala</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-divider-softLight bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#1F2937]">Bölge Filtrele</h3>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {visibleRegionListedCount} listelenen
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {regionFilter.length} seçili
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegionCardOpen((current) => !current)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                    aria-expanded={isRegionCardOpen}
                    aria-label={isRegionCardOpen ? "Bölge filtresini daralt" : "Bölge filtresini genişlet"}
                  >
                    <span className={`transition-transform duration-200 ${isRegionCardOpen ? "rotate-180" : ""}`}>
                      <ChevronIcon />
                    </span>
                  </button>
                </div>
              </div>
              {isRegionCardOpen ? (
                <>
                  <input
                    type="text"
                    value={regionSearch}
                    onChange={(event) => setRegionSearch(event.target.value)}
                    placeholder="Bölge ara..."
                    className="mb-3 h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                  />
                  <div className="max-h-56 space-y-1 overflow-auto pr-1">
                    {visibleRegionOptions
                      .filter((region) => (dynamicRegionCounts.get(region.name) ?? 0) > 0)
                      .map((region) => {
                        const checked = regionFilter.includes(region.name);
                        return (
                          <label
                            key={`region-item-${region.id}`}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                          >
                            <span className="flex items-center gap-2 text-sm text-text-primary">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRegion(region.name)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              {region.name}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {dynamicRegionCounts.get(region.name) ?? 0}
                            </span>
                          </label>
                        );
                      })}
                    {!visibleRegionOptions.filter(
                      (region) => (dynamicRegionCounts.get(region.name) ?? 0) > 0,
                    ).length ? (
                      <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen bölge bulunamadı.</p>
                    ) : null}
                  </div>
                  {regionFilter.length > 0 ? (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setRegionFilter([])}
                        className="text-xs font-medium text-text-secondary underline-offset-2 transition hover:text-text-primary hover:underline"
                      >
                        Temizle
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>

            <section className="rounded-2xl border border-divider-softLight bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#1F2937]">Kurum Filtrele</h3>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {visibleNgoListedCount} listelenen
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {ngoFilter.length} seçili
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNgoCardOpen((current) => !current)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                    aria-expanded={isNgoCardOpen}
                    aria-label={isNgoCardOpen ? "Kurum filtresini daralt" : "Kurum filtresini genişlet"}
                  >
                    <span className={`transition-transform duration-200 ${isNgoCardOpen ? "rotate-180" : ""}`}>
                      <ChevronIcon />
                    </span>
                  </button>
                </div>
              </div>
              {isNgoCardOpen ? (
                <>
                  <input
                    type="text"
                    value={ngoSearch}
                    onChange={(event) => setNgoSearch(event.target.value)}
                    placeholder="Kurum ara..."
                    className="mb-3 h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                  />
                  <div className="max-h-56 space-y-1 overflow-auto pr-1">
                    {visibleNgoOptions
                      .filter((ngo) => (dynamicNgoCounts.get(ngo) ?? 0) > 0)
                      .map((ngo) => {
                        const checked = ngoFilter.includes(ngo);
                        return (
                          <label
                            key={`ngo-item-${ngo}`}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                          >
                            <span className="flex items-center gap-2 text-sm text-text-primary">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleNgo(ngo)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              {ngo}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {dynamicNgoCounts.get(ngo) ?? 0}
                            </span>
                          </label>
                        );
                      })}
                    {!visibleNgoOptions.filter((ngo) => (dynamicNgoCounts.get(ngo) ?? 0) > 0).length ? (
                      <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen kurum bulunamadı.</p>
                    ) : null}
                  </div>
                  {ngoFilter.length > 0 ? (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setNgoFilter([])}
                        className="text-xs font-medium text-text-secondary underline-offset-2 transition hover:text-text-primary hover:underline"
                      >
                        Temizle
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          </div>
        </aside>

        <div className="space-y-3 sm:space-y-4">
          <div ref={resultsTopRef} />
          {filteredProjects.length === 0 ? (
            <div className="rounded-lg border border-divider-softLight bg-surface-pageLight/70 px-4 py-8 text-center text-sm text-text-secondary">
              Seçilen kategori için uygun bağış seçeneği bulunamadı.
            </div>
          ) : null}
          <div className="rounded-xl border border-divider-softLight bg-white/70 px-4 py-3">
            <p className="text-base font-semibold leading-6 text-text-primary sm:text-lg">
              {resultHeader.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">
              {resultHeader.subtitle}
            </p>
          </div>
          {(regionFilter.length > 0 ||
            ngoFilter.length > 0 ||
            search.trim().length > 0 ||
            normalizeText(selectedCategory) !== normalizeText(DEFAULT_CATEGORY)) ? (
            <div className="flex flex-wrap items-center gap-2">
              {normalizeText(selectedCategory) !== normalizeText(DEFAULT_CATEGORY) ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(DEFAULT_CATEGORY)}
                  className="inline-flex items-center rounded-full border border-divider-softLight bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                >
                  ✓ {selectedCategory} ×
                </button>
              ) : null}
              {regionFilter.map((region) => (
                <button
                  key={`active-region-${region}`}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className="inline-flex items-center rounded-full border border-divider-softLight bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                >
                  ✓ {region} ×
                </button>
              ))}
              {ngoFilter.map((ngo) => (
                <button
                  key={`active-ngo-${ngo}`}
                  type="button"
                  onClick={() => toggleNgo(ngo)}
                  className="inline-flex items-center rounded-full border border-divider-softLight bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                >
                  ✓ {ngo} ×
                </button>
              ))}
              {search.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center rounded-full border border-divider-softLight bg-white px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                >
                  ✓ "{search.trim()}" ×
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-4">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={selectedIds.includes(project.id)}
                onToggle={toggleProject}
              />
            ))}
          </div>
          {filteredProjects.length > 0 ? (
            <section className="mt-6 flex justify-center">
              <div className="relative inline-flex items-center gap-2 rounded-full border border-divider-softLight bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-categoryLight hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Önceki sayfa"
                >
                  &lt;
                </button>
                <span className="inline-flex min-w-24 items-center justify-center gap-1 rounded-full px-2 py-1 text-center text-sm font-medium text-text-secondary">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-categoryLight hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Sonraki sayfa"
                >
                  &gt;
                </button>
              </div>
            </section>
          ) : null}
        </div>
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
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface-categoryLight p-4 shadow-2xl"
            style={{ maxHeight: "82vh", overflowY: "auto" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">
                Filtrele
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
                <button
                  type="button"
                  onClick={() => setIsMobileRegionOpen((current) => !current)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-left"
                  aria-expanded={isMobileRegionOpen}
                >
                  <span className="text-xs font-medium text-text-secondary">
                    Bölge {draftRegionFilter.length > 0 ? `(${draftRegionFilter.length} seçili)` : ""}
                  </span>
                  <span className={`text-text-secondary transition-transform ${isMobileRegionOpen ? "rotate-180" : ""}`}>
                    <ChevronIcon />
                  </span>
                </button>
                {isMobileRegionOpen ? (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={draftRegionSearch}
                      onChange={(event) => setDraftRegionSearch(event.target.value)}
                      placeholder="Bölge ara..."
                      className="mb-2 h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                    />
                    <div className="max-h-40 space-y-1 overflow-auto rounded-md border border-divider-softLight bg-surface-pageLight p-2 pr-1">
                      {visibleDraftRegionOptions
                        .filter((region) => (dynamicRegionCounts.get(region.name) ?? 0) > 0)
                        .map((region) => {
                          const checked = draftRegionFilter.includes(region.name);
                          return (
                            <label
                              key={region.id}
                              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2 text-sm text-text-primary">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDraftRegion(region.name)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {region.name}
                              </span>
                              <span className="text-xs text-text-secondary">
                                {dynamicRegionCounts.get(region.name) ?? 0}
                              </span>
                            </label>
                          );
                        })}
                      {!visibleDraftRegionOptions.filter(
                        (region) => (dynamicRegionCounts.get(region.name) ?? 0) > 0,
                      ).length ? (
                        <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen bölge bulunamadı.</p>
                      ) : null}
                    </div>
                    {draftRegionFilter.length > 0 ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setDraftRegionFilter([])}
                          className="text-xs font-medium text-text-secondary underline-offset-2 transition hover:text-text-primary hover:underline"
                        >
                          Temizle
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </label>

              <div className="block">
                <button
                  type="button"
                  onClick={() => setIsMobileNgoOpen((current) => !current)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-left"
                  aria-expanded={isMobileNgoOpen}
                >
                  <span className="text-xs font-medium text-text-secondary">
                    Kurum {draftNgoFilter.length > 0 ? `(${draftNgoFilter.length} seçili)` : ""}
                  </span>
                  <span className={`text-text-secondary transition-transform ${isMobileNgoOpen ? "rotate-180" : ""}`}>
                    <ChevronIcon />
                  </span>
                </button>
                {isMobileNgoOpen ? (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={draftNgoSearch}
                      onChange={(event) => setDraftNgoSearch(event.target.value)}
                      placeholder="Kurum ara…"
                      className="mb-2 h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                    />
                    <div className="max-h-44 space-y-1 overflow-auto rounded-md border border-divider-softLight bg-surface-pageLight p-2 pr-1">
                      {visibleDraftNgoOptions
                        .filter((ngo) => (dynamicNgoCounts.get(ngo) ?? 0) > 0)
                        .map((ngo) => {
                          const checked = draftNgoFilter.includes(ngo);
                          return (
                            <label
                              key={ngo}
                              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2 text-sm text-text-primary">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDraftNgo(ngo)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {ngo}
                              </span>
                              <span className="text-xs text-text-secondary">
                                {dynamicNgoCounts.get(ngo) ?? 0}
                              </span>
                            </label>
                          );
                        })}
                      {!visibleDraftNgoOptions.filter((ngo) => (dynamicNgoCounts.get(ngo) ?? 0) > 0).length ? (
                        <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen kurum bulunamadı.</p>
                      ) : null}
                    </div>
                    {draftNgoFilter.length > 0 ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setDraftNgoFilter([])}
                          className="text-xs font-medium text-text-secondary underline-offset-2 transition hover:text-text-primary hover:underline"
                        >
                          Temizle
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

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
  forceOpenOnDesktop = false,
}: {
  bounds: PriceBounds | null;
  value: PriceBounds | null;
  histogram: Array<{ index: number; count: number; start: number; end: number; intensity: number }>;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  defaultOpen?: boolean;
  floatingPanel?: boolean;
  forceOpenOnDesktop?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const panelOpen = (forceOpenOnDesktop && isDesktop) || isOpen;

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
        onClick={() => {
          if (forceOpenOnDesktop && isDesktop) return;
          setIsOpen((current) => !current);
        }}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:border-divider-softLight/90 ${forceOpenOnDesktop ? "lg:cursor-default" : ""
          }`}
        aria-expanded={panelOpen}
      >
        <div>
          <p className="text-sm font-semibold leading-tight text-text-primary">
            {formatPrice(safeValue.min)} - {formatPrice(safeValue.max)}
          </p>
        </div>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-transform duration-200 ${panelOpen ? "rotate-180" : ""
            } ${forceOpenOnDesktop ? "lg:hidden" : ""}`}
          aria-hidden
        >
          <ChevronIcon />
        </span>
      </button>

      {panelOpen ? (
        <div
          className={`${floatingPanel
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
                  className={`block flex-1 rounded-sm transition-all duration-300 ${isActive ? "bg-brand-primary/40" : "bg-brand-primary/15"
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
