"use client";

import { CircleMarker } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import { RegionGeoJsonLayer } from "@/components/map/RegionGeoJsonLayer";
import type { MapRegion } from "@/components/map/mapTypes";
import type { ZoomStage } from "@/lib/map/zoomUtils";

type AdaptiveRegionLayerProps = {
  regions: Array<MapRegion & { parsedGeoJson: GeoJsonObject | null; projectCount: number }>;
  hoveredRegionId: number | null;
  selectedRegionId: number | null;
  zoomStage: ZoomStage;
  onHoverRegion: (regionId: number | null) => void;
  onSelectRegion: (regionId: number) => void;
};

export function AdaptiveRegionLayer({
  regions,
  hoveredRegionId,
  selectedRegionId,
  zoomStage,
  onHoverRegion,
  onSelectRegion,
}: AdaptiveRegionLayerProps) {
  const markerRadius = zoomStage === "world" ? 10 : zoomStage === "medium" ? 8 : 6;

  return (
    <>
      {zoomStage !== "world"
        ? regions.map((region) =>
            region.parsedGeoJson ? (
              <RegionGeoJsonLayer
                key={`geojson-${region.id}`}
                regionId={region.id}
                data={region.parsedGeoJson}
                active={selectedRegionId === region.id}
                hovered={hoveredRegionId === region.id}
                onHoverStart={onHoverRegion}
                onHoverEnd={() => onHoverRegion(null)}
                onSelect={onSelectRegion}
              />
            ) : null,
          )
        : null}

      {regions
        .filter((region) => region.latitude !== null && region.longitude !== null)
        .map((region) => {
          const active = selectedRegionId === region.id;
          const hovered = hoveredRegionId === region.id;
          return (
            <CircleMarker
              key={`marker-${region.id}`}
              center={[region.latitude as number, region.longitude as number]}
              radius={active ? markerRadius + 2 : hovered ? markerRadius + 1 : markerRadius}
              pathOptions={{
                color: "#065f46",
                weight: active ? 2 : 1.5,
                fillColor: active ? "#10b981" : hovered ? "#34d399" : "#6ee7b7",
                fillOpacity: zoomStage === "world" ? 0.75 : active ? 0.9 : hovered ? 0.8 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelectRegion(region.id),
                mouseover: () => onHoverRegion(region.id),
                mouseout: () => onHoverRegion(null),
              }}
            />
          );
        })}
    </>
  );
}
