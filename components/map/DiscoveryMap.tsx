"use client";

import { useEffect, useMemo } from "react";
import { type LatLngBounds, type LatLngExpression, type Map as LeafletMap } from "leaflet";
import { MapContainer, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { AdaptiveRegionLayer } from "@/components/map/AdaptiveRegionLayer";
import { MapViewportController } from "@/components/map/MapViewportController";
import { RegionPreviewPopup } from "@/components/map/RegionPreviewPopup";
import type { MapRegion, RegionPreview } from "@/components/map/mapTypes";
import type { ZoomStage } from "@/lib/map/zoomUtils";
import { parseRegionGeoJson } from "@/lib/map/geojsonUtils";

type DiscoveryMapProps = {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  regions: MapRegion[];
  regionProjectCounts?: Map<number, number>;
  zoomStage?: ZoomStage;
  showHoverPreview?: boolean;
  showZoomControl?: boolean;
  hoveredRegionId: number | null;
  selectedRegionId: number | null;
  hoveredPreview: RegionPreview | null;
  selectedPreview: RegionPreview | null;
  selectedVisibleRegionCount?: number;
  selectedTopCategories?: string[];
  onViewportChange?: (payload: { bounds: LatLngBounds; zoom: number }) => void;
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
  regionProjectCounts,
  zoomStage = "medium",
  showHoverPreview = true,
  showZoomControl = true,
  hoveredRegionId,
  selectedRegionId,
  hoveredPreview,
  selectedPreview,
  selectedVisibleRegionCount,
  selectedTopCategories,
  onViewportChange,
  onHoverRegion,
  onSelectRegion,
}: DiscoveryMapProps) {
  const normalizedRegions = useMemo(
    () =>
      regions.map((region) => ({
        ...region,
        parsedGeoJson: parseRegionGeoJson(region.geojson),
        projectCount: regionProjectCounts?.get(region.id) ?? 0,
      })),
    [regions, regionProjectCounts],
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
      {showZoomControl ? <ZoomControl position="bottomright" /> : null}
      {onViewportChange ? <MapViewportController onViewportChange={onViewportChange} /> : null}

      <AdaptiveRegionLayer
        regions={normalizedRegions}
        hoveredRegionId={hoveredRegionId}
        selectedRegionId={selectedRegionId}
        zoomStage={zoomStage}
        onHoverRegion={onHoverRegion}
        onSelectRegion={handleSelect}
      />

      {showHoverPreview &&
      hoveredPreview &&
      hoveredPreview.region.latitude !== null &&
      hoveredPreview.region.longitude !== null ? (
        <Popup
          position={[hoveredPreview.region.latitude, hoveredPreview.region.longitude]}
          closeButton={false}
          autoPan={false}
          className="[&_.leaflet-popup-content-wrapper]:!rounded-2xl [&_.leaflet-popup-content-wrapper]:!shadow-none [&_.leaflet-popup-content]:!m-0 [&_.leaflet-popup-tip]:!bg-white"
        >
          <RegionPreviewPopup preview={hoveredPreview} />
        </Popup>
      ) : null}

      {selectedPreview &&
      selectedPreview.region.latitude !== null &&
      selectedPreview.region.longitude !== null ? (
        <Popup
          position={[selectedPreview.region.latitude, selectedPreview.region.longitude]}
          closeButton={false}
          autoPan={false}
          className="[&_.leaflet-popup-content-wrapper]:!rounded-2xl [&_.leaflet-popup-content-wrapper]:!shadow-none [&_.leaflet-popup-content]:!m-0 [&_.leaflet-popup-tip]:!bg-white"
        >
          <RegionPreviewPopup
            preview={selectedPreview}
            visibleRegionCount={selectedVisibleRegionCount}
            topCategories={selectedTopCategories}
          />
        </Popup>
      ) : null}
    </MapContainer>
  );
}
