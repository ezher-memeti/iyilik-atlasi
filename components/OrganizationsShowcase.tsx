"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { OrganizationCatalogItem } from "@/lib/organizationsCatalog";
import common from "@/content/common.json";
import { NgoLogo } from "@/components/NgoLogo";

type OrganizationsShowcaseProps = {
  organizations: OrganizationCatalogItem[];
};

const DESCRIPTION_WORD_LIMIT = 18;
const DESKTOP_CARDS_PER_PAGE = 9;
const MOBILE_CARDS_PER_PAGE = 6;
type SortType = "default" | "name";

function truncateWords(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return `${words.slice(0, limit).join(" ")}...`;
}

export function OrganizationsShowcase({
  organizations,
}: OrganizationsShowcaseProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [cardsPerPage, setCardsPerPage] = useState(DESKTOP_CARDS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = search.trim().toLocaleLowerCase("tr-TR");
    if (!normalizedQuery) return organizations;

    return organizations.filter((organization) =>
      organization.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
    );
  }, [organizations, search]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, cardsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedOrganizations.length / cardsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const visibleOrganizations = sortedOrganizations.slice(startIndex, endIndex);

  return (
    <main className="bg-[#FAFBF9] pb-24 pt-8 text-[#1F2937]">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
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

        <section className="mt-10">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">
                Kurum ara
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                onChange={(event) => setSortBy(event.target.value as SortType)}
                className="h-10 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
              >
                <option value="default">Varsayılan</option>
                <option value="name">İsim (A-Z)</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-sm font-medium text-[#6B7280]">
            Toplam {sortedOrganizations.length} kurum • Sayfa {safeCurrentPage}/{totalPages}
          </p>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
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
                  className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Detayları Gör →
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-10 flex justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-4 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-4 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sonraki
            </button>
          </div>
        </section>

        <section className="mt-16">
          <p className="mx-auto max-w-xl text-center text-sm leading-7 text-[#6B7280]">
            {common.trust.noPayment} {common.trust.officialDescriptions}
          </p>
        </section>
      </div>
    </main>
  );
}
