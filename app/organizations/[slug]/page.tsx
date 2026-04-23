import { notFound } from "next/navigation";
import { NgoLogo } from "@/components/NgoLogo";
import { createCanonicalUrl, createSeoMetadata } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import {
  getOrganizationBySlug,
  getOrganizationCatalog,
} from "@/lib/organizationsCatalog";
import { getKurbanProjectsForOrganization } from "@/lib/organizationProjects";
import { formatPrice } from "@/lib/kurban";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getOrganizationCatalog().map((organization) => ({
    slug: organization.slug,
  }));
}

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganizationBySlug(slug);

  if (!organization) {
    return {};
  }

  return createSeoMetadata({
    title: `${organization.name} | Kurum Profili | İyilik Atlası`,
    description: `${organization.name} kurum profilini, güven bilgilerini ve kurban bağış seçeneklerini İyilik Atlası üzerinden inceleyin.`,
    keywords: [
      `${organization.name} bağış`,
      `${organization.name} kurban bağışı`,
      "kurum profili",
      "İyilik Atlası",
      "iyilikatlasi",
    ],
    url: `/organizations/${organization.slug}`,
  });
}

function normalizeCategory(category?: string) {
  if (!category) {
    return "Belirtilmedi";
  }

  return category.includes("-") ? category.split("-")[1]?.trim() : category;
}

function trustLevel(score?: number) {
  if (!score) {
    return "Belirtilmedi";
  }

  if (score >= 5) {
    return "Yüksek";
  }

  if (score >= 4) {
    return "İyi";
  }

  return "Orta";
}

export default async function OrganizationProfilePage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const projects = getKurbanProjectsForOrganization(organization);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    description: organization.shortDescription,
    foundingDate: organization.foundedYear,
    url: createCanonicalUrl(`/organizations/${organization.slug}`),
    sameAs: [organization.website, organization.donationUrl].filter(Boolean),
  };

  return (
    <main className="bg-[#FAFBF9] pb-24 pt-8 text-[#1F2937] dark:bg-[#0B1210] dark:text-[#E5E7EB]">
      <StructuredData data={organizationSchema} />

      <div className="mx-auto w-full max-w-[1160px] space-y-16 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-[radial-gradient(circle_at_25%_0%,rgba(16,185,129,0.15),transparent_46%),linear-gradient(135deg,#ffffff_0%,#f5faf7_100%)] px-6 py-10 sm:px-10 sm:py-12 dark:bg-[radial-gradient(circle_at_25%_0%,rgba(52,211,153,0.16),transparent_48%),linear-gradient(135deg,#10201B_0%,#0B1210_100%)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            Kurum Profili
          </p>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <NgoLogo name={organization.name} logoUrl={organization.logoUrl} className="h-14 w-14" />

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl dark:text-[#E5E7EB]">
                  {organization.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
                  {organization.shortDescription}
                </p>
                <p className="mt-3 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Kuruluş: {organization.foundedYear || "Belirtilmedi"} · Kategori: {" "}
                  {normalizeCategory(organization.category)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={organization.donationUrl || organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                Bağış Yap →
              </a>
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50/50 dark:border-emerald-300/35 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-white/10"
              >
                Resmi Siteye Git
              </a>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Dış bağlantıya yönlendirilirsiniz.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1F2937] dark:text-[#E5E7EB]">
            Genel Bakış
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#6B7280] dark:text-[#9CA3AF]">
            {organization.shortDescription}. Kurumun faaliyet alanlarını ve hizmet
            bölgelerini inceleyerek bağış tercihinizi daha güvenli bir şekilde
            şekillendirebilirsiniz.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <InfoItem label="Kuruluş yılı" value={organization.foundedYear || "Belirtilmedi"} />
          <InfoItem
            label="Faaliyet alanı"
            value={organization.sectors?.split("·").slice(0, 2).join(" · ") || "Belirtilmedi"}
          />
          <InfoItem
            label="Hizmet bölgeleri"
            value={organization.focusArea || "Belirtilmedi"}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1F2937] dark:text-[#E5E7EB]">
            Güven ve Şeffaflık
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge label={`Güven seviyesi: ${trustLevel(organization.trustScore)}`} />
            {organization.trustScore ? (
              <Badge label={`Güven skoru: ${organization.trustScore}/5`} />
            ) : null}
            {organization.publicBenefit ? (
              <Badge label={`Kamu yararı: ${organization.publicBenefit}`} />
            ) : null}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Bağış Projeleri
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F2937] dark:text-[#E5E7EB]">
                Kurban Bağış Seçenekleri
              </h2>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={`${organization.slug}-${project.name}`}
                  className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-white/5 dark:ring-1 dark:ring-white/10"
                >
                  <h3 className="text-lg font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                    {project.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
                    {project.description}
                  </p>

                  <div className="mt-4 space-y-1 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    {project.price ? <p>Fiyat: {formatPrice(project.price)}</p> : null}
                    {project.region ? <p>Bölge: {project.region}</p> : null}
                  </div>

                  <a
                    href={project.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    Bağış Yap →
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Bu kurum için kurban bağış projesi bilgisi şu anda listelenmiyor.
            </p>
          )}
        </section>

        <section>
          <details className="rounded-xl bg-white/70 p-4 text-sm text-[#6B7280] shadow-sm dark:bg-white/5 dark:text-[#9CA3AF] dark:ring-1 dark:ring-white/10">
            <summary className="cursor-pointer font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
              Ek Bilgiler
            </summary>
            <p className="mt-3 leading-7">
              Kurumun öne çıkan sektörleri: {organization.sectors || "Belirtilmedi"}
            </p>
          </details>
        </section>

        <section className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm dark:bg-white/5 dark:ring-1 dark:ring-white/10">
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
            Bağış işlemi bu platform üzerinden yapılmaz. Devam ettiğinizde ilgili
            kurumun resmi bağış sayfasına yönlendirilirsiniz.
          </p>
          <a
            href={organization.donationUrl || organization.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300"
          >
            Resmi Bağış Sayfasına Git →
          </a>
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-white/5 dark:ring-1 dark:ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] dark:text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-[#1F2937] dark:text-[#E5E7EB]">
        {value}
      </p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
      {label}
    </span>
  );
}
