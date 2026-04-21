import kurbanData from "@/data/kurban.json";

export type KurbanType =
  | "yurt-ici"
  | "yurt-disi"
  | "vacip"
  | "adak"
  | "akika"
  | "sukur"
  | "filistin"
  | "genel";

export type KurbanProject = {
  type: KurbanType;
  title: string;
  price: number;
  description: string;
  donation_url: string;
};

export type KurbanOrganization = {
  name: string;
  slug: string;
  description: string;
  founded?: string;
  projects: KurbanProject[];
};

export type KurbanProjectWithOrganization = KurbanProject & {
  organization: {
    name: string;
    slug: string;
  };
  id: string;
};

export const organizations = kurbanData.organizations as KurbanOrganization[];

export function getAllProjects() {
  return organizations.flatMap((organization) =>
    organization.projects.map((project, projectIndex) => ({
      ...project,
      id: `${organization.slug}-${projectIndex}-${project.type}-${project.title}`,
      organization: {
        name: organization.name,
        slug: organization.slug,
      },
    })),
  );
}

export function getOrganization(slug: string) {
  return organizations.find((organization) => organization.slug === slug);
}

export function getOrganizationGroups() {
  const projects = getAllProjects();

  return organizations.map((organization) => ({
    organization,
    projects: projects.filter(
      (project) => project.organization.slug === organization.slug,
    ),
  }));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}
