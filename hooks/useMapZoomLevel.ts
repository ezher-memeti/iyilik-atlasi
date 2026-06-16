"use client";

import { useMemo } from "react";
import { getZoomStage } from "@/lib/map/zoomUtils";

export function useMapZoomLevel(zoom: number) {
  const stage = useMemo(() => getZoomStage(zoom), [zoom]);
  return { zoomStage: stage };
}
