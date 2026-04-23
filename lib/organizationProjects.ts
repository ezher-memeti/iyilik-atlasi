import { getOrganization } from "@/lib/kurban";
import type { OrganizationCatalogItem } from "@/lib/organizationsCatalog";

export type OrganizationProjectProfile = {
  name: string;
  description: string;
  price?: number;
  region?: string;
  donationUrl: string;
};

const slugAliases: Record<string, string> = {
  "turk-kizilay": "kizilay",
  tdv: "diyanet",
  ihh: "ihh",
  "sadece-insan": "sadece-insan",
};

function inferRegion(focusArea?: string) {
  return focusArea?.split("·")[0]?.trim();
}

function hasKurbanInSectors(sectors?: string) {
  return (sectors ?? "").toLocaleLowerCase("tr-TR").includes("kurban");
}

export function getKurbanProjectsForOrganization(
  organization: OrganizationCatalogItem,
): OrganizationProjectProfile[] {
  const mappedSlug = slugAliases[organization.slug];

  if (mappedSlug) {
    const source = getOrganization(mappedSlug);

    if (source?.projects?.length) {
      return source.projects.map((project) => ({
        name: project.title,
        description: project.description,
        price: project.price > 0 ? project.price : undefined,
        region: inferRegion(organization.focusArea),
        donationUrl: project.donation_url,
      }));
    }
  }

  if (hasKurbanInSectors(organization.sectors)) {
    return [
      {
        name: "Kurban Bağışı",
        description:
          "Kurban bağışınızı kurumun resmi bağış altyapısı üzerinden hızlıca iletebilirsiniz.",
        region: inferRegion(organization.focusArea),
        donationUrl: organization.donationUrl || organization.website,
      },
    ];
  }

  return [];
}
