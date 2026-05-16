"use client";

import { useEffect, useMemo } from "react";
import { type LatLngExpression, type Map as LeafletMap } from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { RegionGeoJsonLayer } from "@/components/map/RegionGeoJsonLayer";
import { RegionPreviewPopup } from "@/components/map/RegionPreviewPopup";
import type { MapRegion, RegionPreview } from "@/components/map/mapTypes";
import { parseRegionGeoJson } from "@/lib/map/geojsonUtils";

type DiscoveryMapProps = {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  regions: MapRegion[];
  hoveredRegionId: number | null;
  selectedRegionId: number | null;
  hoveredPreview: RegionPreview | null;
  onHoverRegion: (regionId: number | null) => void;
  onSelectRegion: (region: MapRegion) => void;
};

const DEFAULT_CENTER: LatLngExpression = [20, 20];
const DEFAULT_ZOOM = 2;

function MapRefBinder({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

export function DiscoveryMap({
  mapRef,
  regions,
  hoveredRegionId,
  selectedRegionId,
  hoveredPreview,
  onHoverRegion,
  onSelectRegion,
}: DiscoveryMapProps) {
  const normalizedRegions = useMemo(
    () =>
      regions.map((region) => ({
        ...region,
        parsedGeoJson: parseRegionGeoJson(region.geojson),
      })),
    [regions],
  );

  const regionById = useMemo(
    () => new Map(normalizedRegions.map((region) => [region.id, region])),
    [normalizedRegions],
  );

  function handleSelect(regionId: number) {
    const region = regionById.get(regionId);
    if (!region) return;
    onSelectRegion(region);
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={2}
      zoomControl={false}
      worldCopyJump
      className="h-full w-full"
    >
      <MapRefBinder mapRef={mapRef} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      <ZoomControl position="bottomright" />

      {normalizedRegions.map((region) =>
        region.parsedGeoJson ? (
          <RegionGeoJsonLayer
            key={`geojson-${region.id}`}
            regionId={region.id}
            data={region.parsedGeoJson}
            active={selectedRegionId === region.id}
            hovered={hoveredRegionId === region.id}
            onHoverStart={onHoverRegion}
            onHoverEnd={() => onHoverRegion(null)}
            onSelect={handleSelect}
          />
        ) : null,
      )}

      {normalizedRegions
        .filter((region) => region.latitude !== null && region.longitude !== null)
        .map((region) => {
          const active = selectedRegionId === region.id;
          const hovered = hoveredRegionId === region.id;
          return (
            <CircleMarker
              key={`marker-${region.id}`}
              center={[region.latitude as number, region.longitude as number]}
              radius={active ? 8 : hovered ? 7 : 6}
              pathOptions={{
                color: "#065f46",
                weight: active ? 2 : 1.5,
                fillColor: active ? "#10b981" : hovered ? "#34d399" : "#6ee7b7",
                fillOpacity: active ? 0.9 : hovered ? 0.8 : 0.7,
              }}
              eventHandlers={{
                click: () => handleSelect(region.id),
                mouseover: () => onHoverRegion(region.id),
                mouseout: () => onHoverRegion(null),
              }}
            />
          );
        })}

      {hoveredPreview && hoveredPreview.region.latitude !== null && hoveredPreview.region.longitude !== null ? (
        <Popup
          position={[hoveredPreview.region.latitude, hoveredPreview.region.longitude]}
          closeButton={false}
          autoPan={false}
          className="[&_.leaflet-popup-content-wrapper]:!rounded-2xl [&_.leaflet-popup-content-wrapper]:!shadow-none [&_.leaflet-popup-content]:!m-0 [&_.leaflet-popup-tip]:!bg-white"
        >
          <RegionPreviewPopup preview={hoveredPreview} />
        </Popup>
      ) : null}
    </MapContainer>
  );
}
