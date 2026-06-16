import { OrganizationsShowcase } from "@/components/OrganizationsShowcase";
import { createSeoMetadata } from "@/components/SEO";
import { getOrganizationCatalogData } from "@/lib/organizationsCatalog";

export const dynamic = "force-dynamic";

export const metadata = createSeoMetadata({
  title: "Kurumlar | İyilik Atlası",
  description:
    "Kurban bağışında yer alan kurumları İyilik Atlası üzerinden tek sayfada inceleyin. Kurum profilleri, açıklamalar ve proje detaylarını karşılaştırın.",
  keywords: [
    "kurumlar",
    "kurumlar",
    "kurban bağışı kurumları",
    "İyilik Atlası",
    "iyilikatlasi",
  ],
  url: "/kurumlar",
});

export default async function OrganizationsPage() {
  const { organizations, categoryOptions, regionOptions } = await getOrganizationCatalogData();

  return (
    <OrganizationsShowcase
      organizations={organizations}
      categoryOptions={categoryOptions}
      regionOptions={regionOptions}
    />
  );
}
