import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { OrganizationDetail } from "@/components/OrganizationDetail";
import { createSeoMetadata, createCanonicalUrl } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { getOrganization, organizations } from "@/lib/kurban";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return organizations.map((organization) => ({
    slug: organization.slug,
  }));
}

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganization(slug);

  if (!organization) {
    return {};
  }

  return createSeoMetadata({
    title: `${organization.name} Kurban Bağışı | İyilik Atlası`,
    description: `${organization.name} kurban bağışı seçeneklerini İyilik Atlası ve iyilikatlasi üzerinden inceleyin. Yurt içi, yurt dışı ve farklı kurban bağışlarını karşılaştırın.`,
    keywords: [
      `${organization.name} kurban bağışı`,
      `${organization.name} kurban fiyatları`,
      "İyilik Atlası",
      "iyilikatlasi",
      "kurban bağışı",
      "bağış karşılaştırma",
    ],
    url: `/organizations/${organization.slug}`,
  });
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganization(slug);

  if (!organization) {
    notFound();
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    description: organization.description,
    foundingDate: organization.founded,
    url: createCanonicalUrl(`/organizations/${organization.slug}`),
    sameAs: Array.from(
      new Set(
        organization.projects.map((project) => {
          const donationUrl = new URL(project.donation_url);
          return donationUrl.origin;
        }),
      ),
    ),
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <StructuredData data={organizationSchema} />
      <OrganizationDetail organization={organization} />
      <Disclaimer />
    </main>
  );
}
