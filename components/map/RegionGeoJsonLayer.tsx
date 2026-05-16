"use client";

import { GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import type { PathOptions } from "leaflet";

type RegionGeoJsonLayerProps = {
  regionId: number;
  data: GeoJsonObject;
  active: boolean;
  hovered: boolean;
  onHoverStart: (regionId: number) => void;
  onHoverEnd: () => void;
  onSelect: (regionId: number) => void;
};

export function RegionGeoJsonLayer({
  regionId,
  data,
  active,
  hovered,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: RegionGeoJsonLayerProps) {
  const style: PathOptions = active
    ? {
        color: "#0f766e",
        weight: 2,
        fillColor: "#34d399",
        fillOpacity: 0.28,
      }
    : hovered
      ? {
          color: "#0f766e",
          weight: 1.5,
          fillColor: "#6ee7b7",
          fillOpacity: 0.2,
        }
      : {
          color: "#0f766e",
          weight: 1,
          fillColor: "#a7f3d0",
          fillOpacity: 0.12,
        };

  return (
    <GeoJSON
      data={data}
      style={style}
      eventHandlers={{
        mouseover: () => onHoverStart(regionId),
        mouseout: () => onHoverEnd(),
        click: () => onSelect(regionId),
      }}
    />
  );
}
