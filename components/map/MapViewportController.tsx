"use client";

import { useMapEvents } from "react-leaflet";
import type { LatLngBounds } from "leaflet";

type MapViewportControllerProps = {
  onViewportChange: (payload: { bounds: LatLngBounds; zoom: number }) => void;
};

export function MapViewportController({ onViewportChange }: MapViewportControllerProps) {
  useMapEvents({
    moveend: (event) => {
      const map = event.target;
      onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
    },
    zoomend: (event) => {
      const map = event.target;
      onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
    },
  });
  return null;
}
