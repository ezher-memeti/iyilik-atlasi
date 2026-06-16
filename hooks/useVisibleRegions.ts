"use client";

import { useMemo } from "react";
import type { LatLngBounds } from "leaflet";
import type { MapRegion } from "@/components/map/mapTypes";
import { getVisibleRegionsByBounds } from "@/lib/map/viewportUtils";

export function useVisibleRegions(regions: MapRegion[], bounds: LatLngBounds | null) {
  const visibleRegions = useMemo(() => getVisibleRegionsByBounds(regions, bounds), [regions, bounds]);
  return { visibleRegions };
}
