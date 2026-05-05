import { OrganizationsShowcase } from "@/components/OrganizationsShowcase";
import { createSeoMetadata } from "@/components/SEO";
import { getOrganizationCatalog } from "@/lib/organizationsCatalog";

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
  url: "/organizations",
});

export default async function OrganizationsPage() {
  const organizations = await getOrganizationCatalog();

  return <OrganizationsShowcase organizations={organizations} />;
}
