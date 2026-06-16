"use client";

import { useMemo } from "react";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";
import { buildRegionRecommendations } from "@/lib/map/recommendationUtils";

export function useMapRecommendations(
  activeRegionId: number | null,
  regions: MapRegion[],
  regionProjectMap: Map<number, RegionProject[]>,
) {
  const recommendations = useMemo(
    () => buildRegionRecommendations({ activeRegionId, regions, regionProjectMap }),
    [activeRegionId, regions, regionProjectMap],
  );

  return { recommendations };
}
