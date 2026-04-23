import Link from "next/link";
import type { OrganizationCatalogItem } from "@/lib/organizationsCatalog";
import common from "@/content/common.json";
import { NgoLogo } from "@/components/NgoLogo";

type OrganizationsShowcaseProps = {
  organizations: OrganizationCatalogItem[];
};

export function OrganizationsShowcase({
  organizations,
}: OrganizationsShowcaseProps) {
  return (
    <main className="bg-[#FAFBF9] pb-24 pt-8 text-[#1F2937] dark:bg-[#0B1210] dark:text-[#E5E7EB]">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.14),transparent_50%),linear-gradient(135deg,#ffffff_0%,#f5faf7_100%)] px-6 py-10 sm:px-10 sm:py-12 dark:bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.12),transparent_52%),linear-gradient(135deg,#10201B_0%,#0B1210_100%)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            Kurumlar
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl dark:text-[#E5E7EB]">
            Bağış yapmadan önce kurumları sade ve güvenilir bir şekilde incele.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#6B7280] dark:text-[#9CA3AF]">
            Her kartta kurumun en kritik özet bilgilerini görür, “Detayları Gör”
            ile profil sayfasına geçerek güven göstergeleri ve Kurban bağış
            seçeneklerini inceleyebilirsin.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
          {organizations.map((organization) => {
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
                className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-white/5 dark:ring-1 dark:ring-white/10 dark:hover:bg-white/[0.07]"
              >
                <div className="flex items-start gap-4">
                  <NgoLogo name={organization.name} logoUrl={organization.logoUrl} />

                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                      {organization.name}
                    </h2>
                    {organization.foundedYear ? (
                      <p className="mt-1 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                        {common.labels.founded}: {organization.foundedYear}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 min-h-14 text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
                  {organization.shortDescription}
                </p>

                {trust || distinguishing ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trust ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
                        {trust}
                      </span>
                    ) : null}
                    {distinguishing ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-300">
                        {distinguishing}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <Link
                  href={`/organizations/${organization.slug}`}
                  className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  Detayları Gör →
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-16">
          <p className="mx-auto max-w-xl text-center text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
            {common.trust.noPayment} {common.trust.officialDescriptions}
          </p>
        </section>
      </div>
    </main>
  );
}
