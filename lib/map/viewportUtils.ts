import type { LatLngBounds } from "leaflet";
import type { MapRegion } from "@/components/map/mapTypes";

export function getVisibleRegionsByBounds(regions: MapRegion[], bounds: LatLngBounds | null) {
  if (!bounds) return regions;
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();

  return regions.filter((region) => {
    if (region.latitude === null || region.longitude === null) return false;
    return (
      region.latitude >= south &&
      region.latitude <= north &&
      region.longitude >= west &&
      region.longitude <= east
    );
  });
}
