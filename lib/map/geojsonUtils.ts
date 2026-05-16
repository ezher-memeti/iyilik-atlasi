import type { GeoJsonObject } from "geojson";

export function parseRegionGeoJson(input: unknown): GeoJsonObject | null {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return isGeoJson(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isGeoJson(input) ? input : null;
}

function isGeoJson(value: unknown): value is GeoJsonObject {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown };
  return typeof candidate.type === "string";
}
