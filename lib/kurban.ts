import { getProjects, type ProjectListItem } from "@/lib/api/getProjects";
import type { KurbanProjectWithOrganization, KurbanType } from "@/lib/donationModels";

function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferTypeFromProject(project: ProjectListItem): KurbanType {
  const text = `${project.title} ${project.categories.map((c) => c.name).join(" ")}`.toLocaleLowerCase(
    "tr-TR",
  );

  if (text.includes("filistin")) return "filistin";
  if (text.includes("yurt dışı") || text.includes("yurtdışı")) return "yurt-disi";
  if (text.includes("yurt içi") || text.includes("yurtiçi")) return "yurt-ici";
  if (text.includes("vacip")) return "vacip";
  if (text.includes("adak")) return "adak";
  if (text.includes("akika")) return "akika";
  if (text.includes("şükür") || text.includes("sukur")) return "sukur";
  return "genel";
}

function mapProject(project: ProjectListItem): KurbanProjectWithOrganization {
  const ngoName = project.ngo?.name ?? "Bilinmeyen Kurum";
  const ngoId = project.ngo?.id ?? 0;
  const regions = project.bolgeler.map((bolge) => bolge.name);

  return {
    id: String(project.id),
    type: inferTypeFromProject(project),
    title: project.title,
    price: project.price ?? 0,
    description: `Kategori: ${project.categories.map((c) => c.name).join(", ") || "Belirtilmedi"}`,
    region: regions[0] ?? undefined,
    regions: regions.length ? regions : undefined,
    donation_url: project.donation_url,
    is_visible: project.is_visible,
    organization: {
      id: ngoId,
      name: ngoName,
      slug: createSlug(ngoName),
      logoUrl: project.ngo?.logo_url ?? undefined,
    },
    categories: project.categories,
  };
}

export async function getAllProjects() {
  const projects = await getProjects();
  return projects.map(mapProject);
}

export async function getOrganization(slug: string) {
  const groups = await getOrganizationGroups();
  return groups.find((organization) => organization.organization.slug === slug)?.organization;
}

export async function getOrganizationGroups() {
  const projects = await getAllProjects();
  const groupMap = new Map<
    string,
    {
      organization: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        founded?: string;
      };
      projects: KurbanProjectWithOrganization[];
    }
  >();

  projects.forEach((project) => {
    const existing = groupMap.get(project.organization.slug);
    if (existing) {
      existing.projects.push(project);
      return;
    }

    groupMap.set(project.organization.slug, {
      organization: {
        id: project.organization.id,
        name: project.organization.name,
        slug: project.organization.slug,
      },
      projects: [project],
    });
  });

  return Array.from(groupMap.values());
}

export { formatPrice } from "@/lib/donationModels";
