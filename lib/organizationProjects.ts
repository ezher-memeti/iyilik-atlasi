import { getAllProjects } from "@/lib/kurban";
import type { OrganizationCatalogItem } from "@/lib/organizationsCatalog";

export type OrganizationProjectProfile = {
  id: string;
  name: string;
  description: string;
  price?: number;
  region?: string;
  categories: string[];
  donationUrl: string;
};

export async function getKurbanProjectsForOrganization(
  organization: OrganizationCatalogItem,
): Promise<OrganizationProjectProfile[]> {
  const projects = await getAllProjects();
  const orgProjects = projects.filter(
    (project) => project.organization.slug === organization.slug,
  );

  if (!orgProjects.length) {
    return [];
  }

  return orgProjects.map((project) => ({
    id: project.id,
    name: project.title,
    description: project.description,
    price: project.price > 0 ? project.price : undefined,
    region: project.region,
    categories: project.categories.map((category) => category.name),
    donationUrl: project.donation_url,
  }));
}
