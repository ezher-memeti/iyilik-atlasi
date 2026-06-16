import type { MapRegion, RegionProject } from "@/components/map/mapTypes";

export type RegionRecommendation = {
  regionId: number;
  regionName: string;
  reason: string;
  projectCount: number;
};

function overlapScore(a: RegionProject[], b: RegionProject[]) {
  const categoriesA = new Set(
    a.flatMap((project) => project.categories.filter((category) => category.parent_id !== null).map((c) => c.name)),
  );
  const categoriesB = new Set(
    b.flatMap((project) => project.categories.filter((category) => category.parent_id !== null).map((c) => c.name)),
  );
  let overlap = 0;
  categoriesA.forEach((name) => {
    if (categoriesB.has(name)) overlap += 1;
  });
  return overlap;
}

export function buildRegionRecommendations(params: {
  activeRegionId: number | null;
  regions: MapRegion[];
  regionProjectMap: Map<number, RegionProject[]>;
  limit?: number;
}) {
  const { activeRegionId, regions, regionProjectMap, limit = 3 } = params;
  if (activeRegionId === null) return [];
  const activeProjects = regionProjectMap.get(activeRegionId) ?? [];
  if (!activeProjects.length) return [];

  const ranked = regions
    .filter((region) => region.id !== activeRegionId)
    .map((region) => {
      const projects = regionProjectMap.get(region.id) ?? [];
      const score = overlapScore(activeProjects, projects);
      return { region, projects, score };
    })
    .filter((item) => item.projects.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.projects.length - a.projects.length;
    })
    .slice(0, limit);

  return ranked.map<RegionRecommendation>((item) => ({
    regionId: item.region.id,
    regionName: item.region.name,
    reason: item.score > 0 ? "Benzer kategori dağılımı" : "Yakın yoğunlukta aktif projeler",
    projectCount: item.projects.length,
  }));
}
