"use client";

import { useMemo } from "react";
import { parseRegionGeoJson } from "@/lib/map/geojsonUtils";
import type { MapRegion, RegionProject, RegionPreview } from "@/components/map/mapTypes";

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

export function useRegionMapData(regions: MapRegion[], projects: RegionProject[], hoveredRegionId: number | null) {
  const normalizedRegions = useMemo(
    () =>
      regions.map((region) => ({
        ...region,
        parsedGeoJson: parseRegionGeoJson(region.geojson),
      })),
    [regions],
  );

  const regionProjectMap = useMemo(() => {
    const map = new Map<number, RegionProject[]>();
    normalizedRegions.forEach((region) => {
      const regionProjects = projects.filter((project) =>
        (project.regions ?? []).some((name) => normalize(name) === normalize(region.name)),
      );
      map.set(region.id, regionProjects);
    });
    return map;
  }, [normalizedRegions, projects]);

  const hoveredPreview = useMemo<RegionPreview | null>(() => {
    if (hoveredRegionId === null) return null;
    const region = normalizedRegions.find((item) => item.id === hoveredRegionId);
    if (!region) return null;
    const regionProjects = regionProjectMap.get(region.id) ?? [];
    const ngoCount = new Set(regionProjects.map((project) => project.organization.id)).size;
    return { region, projectCount: regionProjects.length, ngoCount };
  }, [hoveredRegionId, normalizedRegions, regionProjectMap]);

  return { normalizedRegions, regionProjectMap, hoveredPreview };
}
