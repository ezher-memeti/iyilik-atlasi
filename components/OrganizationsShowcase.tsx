"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  OrganizationCatalogItem,
  OrganizationFilterOption,
} from "@/lib/organizationsCatalog";
import common from "@/content/common.json";
import { NgoLogo } from "@/components/NgoLogo";
import { OrganizationFiltersPanel } from "@/components/OrganizationFiltersPanel";

type OrganizationsShowcaseProps = {
  organizations: OrganizationCatalogItem[];
  regionOptions: OrganizationFilterOption[];
  categoryOptions: OrganizationFilterOption[];
};

const DESCRIPTION_WORD_LIMIT = 18;
const DESKTOP_CARDS_PER_PAGE = 9;
const MOBILE_CARDS_PER_PAGE = 6;
type SortType = "default" | "name";
const ORGANIZATIONS_STATE_KEY = "organizations_showcase_state_v1";
const ORGANIZATIONS_RESTORE_INTENT_KEY = "organizations_showcase_restore_intent_v1";

function truncateWords(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return `${words.slice(0, limit).join(" ")}...`;
}

function toggleSelection(selected: number[], id: number) {
  return selected.includes(id)
    ? selected.filter((item) => item !== id)
    : [...selected, id];
}

export function OrganizationsShowcase({
  organizations,
  regionOptions,
  categoryOptions,
}: OrganizationsShowcaseProps) {
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [cardsPerPage, setCardsPerPage] = useState(DESKTOP_CARDS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegionIds, setSelectedRegionIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileRegionDraft, setMobileRegionDraft] = useState<number[]>([]);
  const [mobileCategoryDraft, setMobileCategoryDraft] = useState<number[]>([]);
  const [regionSearch, setRegionSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const hasRestoredRef = useRef(false);
  const isRestoringRef = useRef(false);
  const pendingRestoreRef = useRef<{
    selectedSlug?: string;
    scrollY?: number;
    targetPage?: number;
  } | null>(null);

  useEffect(() => {
    const updateCardsPerPage = () => {
      setCardsPerPage(
        window.innerWidth >= 1024 ? DESKTOP_CARDS_PER_PAGE : MOBILE_CARDS_PER_PAGE,
      );
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  const regionCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const organization of organizations) {
      const uniqueRegionIds = Array.from(new Set(organization.regionIds));
      for (const regionId of uniqueRegionIds) {
        counts[regionId] = (counts[regionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [organizations]);

  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const organization of organizations) {
      const uniqueCategoryIds = Array.from(new Set(organization.categoryIds));
      for (const categoryId of uniqueCategoryIds) {
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = search.trim().toLocaleLowerCase("tr-TR");

    return organizations.filter((organization) => {
      const matchesSearch =
        !normalizedQuery ||
        organization.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery);

      const matchesRegion =
        selectedRegionIds.length === 0 ||
        organization.regionIds.some((regionId) => selectedRegionIds.includes(regionId));

      const matchesCategory =
        selectedCategoryIds.length === 0 ||
        organization.categoryIds.some((categoryId) =>
          selectedCategoryIds.includes(categoryId),
        );

      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [organizations, search, selectedRegionIds, selectedCategoryIds]);

  const sortedOrganizations = useMemo(() => {
    if (sortBy === "name") {
      return [...filteredOrganizations].sort((a, b) =>
        a.name.localeCompare(b.name, "tr"),
      );
    }

    return [...filteredOrganizations].sort((a, b) => {
      const aScore = a.trustScore ?? 0;
      const bScore = b.trustScore ?? 0;
      return bScore - aScore;
    });
  }, [filteredOrganizations, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedOrganizations.length / cardsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const visibleOrganizations = sortedOrganizations.slice(startIndex, endIndex);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const restoreIntent = window.sessionStorage.getItem(ORGANIZATIONS_RESTORE_INTENT_KEY);
      if (restoreIntent !== "1") return;

      const raw = window.sessionStorage.getItem(ORGANIZATIONS_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        source?: string;
        search?: string;
        sortBy?: SortType;
        currentPage?: number;
        selectedRegionIds?: number[];
        selectedCategoryIds?: number[];
        selectedSlug?: string;
        scrollY?: number;
      };
      if (parsed.source !== "organization-profile") return;
      isRestoringRef.current = true;

      if (typeof parsed.search === "string") setSearch(parsed.search);
      if (parsed.sortBy === "default" || parsed.sortBy === "name") setSortBy(parsed.sortBy);
      if (Array.isArray(parsed.selectedRegionIds)) {
        setSelectedRegionIds(parsed.selectedRegionIds.filter((id) => Number.isFinite(id)));
      }
      if (Array.isArray(parsed.selectedCategoryIds)) {
        setSelectedCategoryIds(parsed.selectedCategoryIds.filter((id) => Number.isFinite(id)));
      }
      if (typeof parsed.currentPage === "number" && Number.isFinite(parsed.currentPage)) {
        setCurrentPage(Math.max(1, Math.floor(parsed.currentPage)));
      }
      pendingRestoreRef.current = {
        selectedSlug: parsed.selectedSlug,
        scrollY: parsed.scrollY,
        targetPage:
          typeof parsed.currentPage === "number" && Number.isFinite(parsed.currentPage)
            ? Math.max(1, Math.floor(parsed.currentPage))
            : 1,
      };
    } catch {
      window.sessionStorage.removeItem(ORGANIZATIONS_STATE_KEY);
      window.sessionStorage.removeItem(ORGANIZATIONS_RESTORE_INTENT_KEY);
    }
  }, []);

  useEffect(() => {
    const pending = pendingRestoreRef.current;
    if (!pending) return;
    if (pending.targetPage && safeCurrentPage !== pending.targetPage) {
      setCurrentPage(pending.targetPage);
      return;
    }

    const selectedSlug = pending.selectedSlug?.trim();
    if (selectedSlug) {
      const selectedCard = document.getElementById(`org-card-${selectedSlug}`);
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: "auto", block: "center" });
        window.sessionStorage.removeItem(ORGANIZATIONS_STATE_KEY);
        window.sessionStorage.removeItem(ORGANIZATIONS_RESTORE_INTENT_KEY);
        pendingRestoreRef.current = null;
        isRestoringRef.current = false;
        return;
      }
    }

    window.scrollTo({ top: Math.max(0, pending.scrollY ?? 0), behavior: "auto" });
    window.sessionStorage.removeItem(ORGANIZATIONS_STATE_KEY);
    window.sessionStorage.removeItem(ORGANIZATIONS_RESTORE_INTENT_KEY);
    pendingRestoreRef.current = null;
    isRestoringRef.current = false;
  }, [visibleOrganizations]);

  function persistListStateBeforeNavigate(selectedSlug: string) {
    try {
      const selectedIndex = sortedOrganizations.findIndex(
        (organization) => organization.slug === selectedSlug,
      );
      const derivedPage =
        selectedIndex >= 0
          ? Math.floor(selectedIndex / cardsPerPage) + 1
          : safeCurrentPage;

      window.sessionStorage.setItem(
        ORGANIZATIONS_STATE_KEY,
        JSON.stringify({
          source: "organization-profile",
          search,
          sortBy,
          currentPage: derivedPage,
          selectedRegionIds,
          selectedCategoryIds,
          selectedSlug,
          scrollY: window.scrollY,
        }),
      );
    } catch {
      // no-op
    }
  }

  const hasActiveFilters = selectedRegionIds.length > 0 || selectedCategoryIds.length > 0;

  function handlePaginationChange(nextPage: number) {
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      topAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetAllFilters() {
    setSelectedRegionIds([]);
    setSelectedCategoryIds([]);
    setRegionSearch("");
    setCategorySearch("");
    setMobileRegionDraft([]);
    setMobileCategoryDraft([]);
    setCurrentPage(1);
  }

  function openMobileFilters() {
    setMobileRegionDraft(selectedRegionIds);
    setMobileCategoryDraft(selectedCategoryIds);
    setMobileDrawerOpen(true);
  }

  return (
    <main className="bg-[#FAFBF9] pb-24 pt-8 text-[#1F2937]">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div ref={topAnchorRef} />
        <section className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.14),transparent_50%),linear-gradient(135deg,#ffffff_0%,#f5faf7_100%)] px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Kurumlar
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
            Bağış yapmadan önce kurumları sade ve güvenilir bir şekilde incele.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#6B7280]">
            Her kartta kurumun en kritik özet bilgilerini görür, “Detayları Gör”
            ile profil sayfasına geçerek güven göstergeleri ve Kurban bağış
            seçeneklerini inceleyebilirsin.
          </p>
        </section>

        <section className="mt-10 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-7">
          <aside className="sticky top-24 hidden lg:block">
            <OrganizationFiltersPanel
              regionOptions={regionOptions}
              categoryOptions={categoryOptions}
              selectedRegionIds={selectedRegionIds}
              selectedCategoryIds={selectedCategoryIds}
              regionSearch={regionSearch}
              categorySearch={categorySearch}
              regionCounts={regionCounts}
              categoryCounts={categoryCounts}
              onRegionSearchChange={setRegionSearch}
              onCategorySearchChange={setCategorySearch}
              onToggleRegion={(id) => {
                setSelectedRegionIds((prev) => toggleSelection(prev, id));
                setCurrentPage(1);
              }}
              onToggleCategory={(id) => {
                setSelectedCategoryIds((prev) => toggleSelection(prev, id));
                setCurrentPage(1);
              }}
            />
          </aside>

          <div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-text-secondary">
                    Kurum ara
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Kurum adına göre ara…"
                    className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
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
                      setCurrentPage(1);
                    }}
                    className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
                  >
                    <option value="default">Varsayılan</option>
                    <option value="name">İsim (A-Z)</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={openMobileFilters}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-700/35 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50/50"
                >
                  Filtrele
                  {hasActiveFilters ? ` (${selectedRegionIds.length + selectedCategoryIds.length})` : ""}
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-divider-softLight bg-white px-4 text-sm font-medium text-text-secondary transition hover:bg-slate-50"
                  >
                    Filtreleri temizle
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedRegionIds.map((id) => {
                  const region = regionOptions.find((option) => option.id === id);
                  if (!region) return null;
                  return (
                    <button
                      key={`region-${id}`}
                      type="button"
                      onClick={() => {
                        setSelectedRegionIds((prev) => prev.filter((item) => item !== id));
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                    >
                      {region.name} ×
                    </button>
                  );
                })}
                {selectedCategoryIds.map((id) => {
                  const category = categoryOptions.find((option) => option.id === id);
                  if (!category) return null;
                  return (
                    <button
                      key={`category-${id}`}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds((prev) => prev.filter((item) => item !== id));
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {category.name} ×
                    </button>
                  );
                })}
              </div>

              <p className="text-sm font-medium text-[#6B7280]">
                Toplam {sortedOrganizations.length} kurum • Sayfa {safeCurrentPage}/{totalPages}
              </p>
            </div>

            {visibleOrganizations.length ? (
              <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
                {visibleOrganizations.map((organization) => {
                  const trust = organization.trustScore
                    ? `${organization.trustScore}/5 Güven Skoru`
                    : null;
                  const distinguishing = organization.countryCount
                    ? `${organization.countryCount} ülkede faaliyet`
                    : organization.focusArea
                      ? organization.focusArea.split("·")[0]?.trim()
                      : null;

                  return (
                    <article
                      key={organization.slug}
                      id={`org-card-${organization.slug}`}
                      className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <NgoLogo name={organization.name} logoUrl={organization.logoUrl} />

                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-[#1F2937]">
                            {organization.name}
                          </h2>
                          {organization.foundedYear ? (
                            <p className="mt-1 text-sm text-[#6B7280]">
                              {common.labels.founded}: {organization.foundedYear}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-4 min-h-14 text-sm leading-7 text-[#6B7280]">
                        {truncateWords(organization.shortDescription, DESCRIPTION_WORD_LIMIT)}
                      </p>

                      {trust || distinguishing ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {trust ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                              {trust}
                            </span>
                          ) : null}
                          {distinguishing ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {distinguishing}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <Link
                        href={`/organizations/${organization.slug}`}
                        onClick={() => persistListStateBeforeNavigate(organization.slug)}
                        className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                      >
                        Detayları Gör →
                      </Link>
                    </article>
                  );
                })}
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-dashed border-divider-softLight bg-white p-8 text-center">
                <h3 className="text-lg font-semibold text-text-primary">Sonuç bulunamadı</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  Seçtiğiniz filtrelere uygun kurum bulunamadı. Filtreleri temizleyerek tekrar
                  deneyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary"
                >
                  Filtreleri Sıfırla
                </button>
              </section>
            )}

            <section className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-divider-softLight bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => handlePaginationChange(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-categoryLight hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Önceki sayfa"
                >
                  &lt;
                </button>
                <p className="min-w-20 text-center text-sm font-medium text-text-secondary">
                  {safeCurrentPage} of {totalPages}
                </p>
                <button
                  type="button"
                  onClick={() => handlePaginationChange(Math.min(totalPages, safeCurrentPage + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-categoryLight hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Sonraki sayfa"
                >
                  &gt;
                </button>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-16">
          <p className="mx-auto max-w-xl text-center text-sm leading-7 text-[#6B7280]">
            {common.trust.noPayment} {common.trust.officialDescriptions}
          </p>
        </section>
      </div>

      {mobileDrawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Filtre panelini kapat"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Filtrele</h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-text-secondary"
              >
                Kapat
              </button>
            </div>

            <div className="max-h-[58vh] overflow-auto pr-1 pb-24">
              <OrganizationFiltersPanel
                regionOptions={regionOptions}
                categoryOptions={categoryOptions}
                selectedRegionIds={mobileRegionDraft}
                selectedCategoryIds={mobileCategoryDraft}
                regionSearch={regionSearch}
                categorySearch={categorySearch}
                regionCounts={regionCounts}
                categoryCounts={categoryCounts}
                onRegionSearchChange={setRegionSearch}
                onCategorySearchChange={setCategorySearch}
                onToggleRegion={(id) =>
                  setMobileRegionDraft((prev) => toggleSelection(prev, id))
                }
                onToggleCategory={(id) =>
                  setMobileCategoryDraft((prev) => toggleSelection(prev, id))
                }
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 border-t border-divider-softLight bg-white p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileRegionDraft([]);
                    setMobileCategoryDraft([]);
                    setSelectedRegionIds([]);
                    setSelectedCategoryIds([]);
                    setCurrentPage(1);
                    setMobileDrawerOpen(false);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-divider-softLight bg-white px-4 text-sm font-semibold text-text-secondary"
                >
                  Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegionIds(mobileRegionDraft);
                    setSelectedCategoryIds(mobileCategoryDraft);
                    setCurrentPage(1);
                    setMobileDrawerOpen(false);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
