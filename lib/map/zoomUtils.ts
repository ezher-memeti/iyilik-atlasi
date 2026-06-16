export type ZoomStage = "world" | "medium" | "close";

export function getZoomStage(zoom: number): ZoomStage {
  if (zoom <= 3) return "world";
  if (zoom <= 6) return "medium";
  return "close";
}
