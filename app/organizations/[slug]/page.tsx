import { notFound } from "next/navigation";
import { NgoLogo } from "@/components/NgoLogo";
import { BackToOrganizationsButton } from "@/components/BackToOrganizationsButton";
import { OrganizationProjectsFilterSection } from "@/components/OrganizationProjectsFilterSection";
import { createCanonicalUrl, createSeoMetadata } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import {
  getOrganizationBySlug,
  getOrganizationCatalog,
} from "@/lib/organizationsCatalog";
import { getKurbanProjectsForOrganization } from "@/lib/organizationProjects";

export const dynamic = "force-dynamic";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return {
      title: "Kurum Bulunamadı",
      description: "Aradığınız kurum bulunamadı.",
      robots: { index: false, follow: false },
    };
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

function formatTerritories(territories?: string[], fallback?: string) {
  if (territories && territories.length > 0) {
    return territories.join(", ");
  }
  return fallback || "Belirtilmedi";
}

export default async function OrganizationProfilePage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const projects = await getKurbanProjectsForOrganization(organization);
  const projectCategories = Array.from(
    new Set(
      projects
        .flatMap((project) => project.categories)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  );
  const projectTerritories = Array.from(
    new Set(
      projects
        .flatMap((project) => project.regions ?? (project.region ? [project.region] : []))
        .map((region) => region.trim())
      .filter((region): region is string => Boolean(region)),
    ),
  );

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
    <main className="bg-[#FAFBF9] pb-24 pt-8 text-[#1F2937]">
      <StructuredData data={organizationSchema} />

      <div className="mx-auto w-full max-w-[1160px] space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="pt-2">
          <BackToOrganizationsButton />
        </div>

        <section className="rounded-3xl bg-[radial-gradient(circle_at_25%_0%,rgba(16,185,129,0.15),transparent_46%),linear-gradient(135deg,#ffffff_0%,#f5faf7_100%)] px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Kurum Profili
          </p>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <NgoLogo name={organization.name} logoUrl={organization.logoUrl} className="h-14 w-14" />

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
                  {organization.name}
                </h1>
                <p className="mt-3 text-xs font-medium text-[#6B7280]">
                  Kategori: {normalizeCategory(organization.category)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={organization.donationUrl || organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Bağış Yap →
              </a>
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50/50"
              >
                Resmi Siteye Git
              </a>
              <p className="text-xs text-[#6B7280]">
                Dış bağlantıya yönlendirilirsiniz.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
            Genel Bakış
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#6B7280]">
            {organization.shortDescription}. Kurumun faaliyet alanlarını ve hizmet
            bölgelerini inceleyerek bağış tercihinizi daha güvenli bir şekilde
            şekillendirebilirsiniz.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <InfoItem
            label="Faaliyet alanı"
            value={
              projectCategories.length > 0
                ? projectCategories.join(", ")
                : "Belirtilmedi"
            }
          />
          <InfoItem
            label="Hizmet bölgeleri"
            value={formatTerritories(projectTerritories, organization.focusArea)}
          />
        </section>

        {projects.length > 0 ? (
          <OrganizationProjectsFilterSection projects={projects} />
        ) : (
          <section>
            <p className="mt-6 text-sm text-[#6B7280]">
              Bu kurum için kurban bağış projesi bilgisi şu anda listelenmiyor.
            </p>
          </section>
        )}

        <section>
          <details className="rounded-xl bg-white/70 p-4 text-sm text-[#6B7280] shadow-sm">
            <summary className="cursor-pointer font-semibold text-[#1F2937]">
              Ek Bilgiler
            </summary>
            <p className="mt-3 leading-7">
              Kurumun öne çıkan sektörleri: {organization.sectors || "Belirtilmedi"}
            </p>
          </details>
        </section>

        <section className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[#6B7280]">
            Bağış işlemi bu platform üzerinden yapılmaz. Devam ettiğinizde ilgili
            kurumun resmi bağış sayfasına yönlendirilirsiniz.
          </p>
          <a
            href={organization.donationUrl || organization.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-[#1F2937]">
        {value}
      </p>
    </div>
  );
}
