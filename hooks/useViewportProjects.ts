"use client";

import { useMemo } from "react";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";

export function useViewportProjects(
  visibleRegions: MapRegion[],
  regionProjectMap: Map<number, RegionProject[]>,
) {
  const visibleProjects = useMemo(() => {
    const aggregate = new Map<string, RegionProject>();
    visibleRegions.forEach((region) => {
      const projects = regionProjectMap.get(region.id) ?? [];
      projects.forEach((project) => aggregate.set(project.id, project));
    });
    return Array.from(aggregate.values());
  }, [regionProjectMap, visibleRegions]);

  const visibleNgoCount = useMemo(
    () => new Set(visibleProjects.map((project) => project.organization.id)).size,
    [visibleProjects],
  );

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    visibleProjects.forEach((project) => {
      project.categories
        .filter((category) => category.parent_id !== null)
        .forEach((category) => counts.set(category.name, (counts.get(category.name) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [visibleProjects]);

  return { visibleProjects, visibleNgoCount, topCategories };
}
