"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { LatLngBounds, Map as LeafletMap } from "leaflet";
import { MobileDiscoveryChips } from "@/components/map/MobileDiscoveryChips";
import { MobileMapBottomSheet } from "@/components/map/MobileMapBottomSheet";
import { MobileMapSearch } from "@/components/map/MobileMapSearch";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";
import { useMapFilterSync } from "@/hooks/useMapFilterSync";
import { useMapRecommendations } from "@/hooks/useMapRecommendations";
import { useMapZoomLevel } from "@/hooks/useMapZoomLevel";
import { useRegionMapData } from "@/hooks/useRegionMapData";
import { useViewportProjects } from "@/hooks/useViewportProjects";
import { useVisibleRegions } from "@/hooks/useVisibleRegions";

const DiscoveryMap = dynamic(
  () => import("@/components/map/DiscoveryMap").then((mod) => mod.DiscoveryMap),
  { ssr: false },
);

type MobileMapPageProps = {
  regions: MapRegion[];
  projects: RegionProject[];
};

export function MobileMapPage({ regions, projects }: MobileMapPageProps) {
  const router = useRouter();
  const { applyRegionToUrl, clearRegionFromUrl } = useMapFilterSync();
  const mapRef = useRef<LeafletMap | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [viewportBounds, setViewportBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState<number>(2);
  const [sheetOpen, setSheetOpen] = useState(true);

  const { regionProjectMap } = useRegionMapData(regions, projects, null);
  const { visibleRegions } = useVisibleRegions(regions, viewportBounds);
  const { visibleProjects, visibleNgoCount, topCategories } = useViewportProjects(visibleRegions, regionProjectMap);
  const { recommendations } = useMapRecommendations(selectedRegionId, regions, regionProjectMap);
  const { zoomStage } = useMapZoomLevel(zoom);

  const regionProjectCounts = useMemo(() => {
    const counts = new Map<number, number>();
    regions.forEach((region) => counts.set(region.id, (regionProjectMap.get(region.id) ?? []).length));
    return counts;
  }, [regionProjectMap, regions]);

  const selectedRegionProjects = useMemo(() => {
    if (selectedRegionId === null) return visibleProjects;
    return regionProjectMap.get(selectedRegionId) ?? [];
  }, [regionProjectMap, selectedRegionId, visibleProjects]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId) ?? null,
    [regions, selectedRegionId],
  );

  function handleRegionSelect(region: MapRegion) {
    setSelectedRegionId(region.id);
    setSheetOpen(true);
    if (region.latitude !== null && region.longitude !== null) {
      mapRef.current?.flyTo([region.latitude, region.longitude], region.map_zoom ?? 4, {
        duration: 1,
      });
    }
    applyRegionToUrl(region.name);
  }

  return (
    <main className="fixed inset-0 z-[70] isolate h-[100dvh] min-h-[100dvh] bg-surface-pageLight">
      <div className="absolute left-3 top-[max(12px,env(safe-area-inset-top))] z-[1400] pointer-events-auto">
        <Link
          href="/bagislar"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 bg-white/95 px-4 text-sm font-medium text-text-primary shadow-md backdrop-blur"
        >
          ← Bağışlara Dön
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          mapRef.current?.flyTo([20, 20], 2, { duration: 1.05 });
          setSelectedRegionId(null);
        }}
        className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-[1400] inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 bg-white/95 px-4 text-sm font-medium text-text-primary shadow-md backdrop-blur"
        aria-label="Tüm haritayı göster"
      >
        Tüm harita
      </button>
      <button
        type="button"
        onClick={() => {
          setSelectedRegionId(null);
          mapRef.current?.flyTo([20, 20], 2, { duration: 1.05 });
          clearRegionFromUrl();
        }}
        className="absolute right-3 top-[calc(max(12px,env(safe-area-inset-top))+52px)] z-[1400] inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 bg-white/95 px-4 text-sm font-medium text-text-primary shadow-md backdrop-blur"
        aria-label="Harita filtrelerini temizle"
      >
        Temizle
      </button>
      <div className="h-full w-full">
        {regions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-text-secondary">
            Harita verileri şu anda yüklenemedi.
          </div>
        ) : (
          <div className="relative h-full min-h-[100dvh]">
            <div className="absolute inset-x-3 top-[calc(max(12px,env(safe-area-inset-top))+56px)] z-[1400] space-y-2 pointer-events-auto">
              <MobileMapSearch
                regions={visibleRegions.length ? visibleRegions : regions}
                projects={projects}
                onSelectRegion={(regionId) => {
                  const region = regions.find((item) => item.id === regionId);
                  if (region) handleRegionSelect(region);
                }}
              />
              <MobileDiscoveryChips
                regions={
                  (visibleRegions.length ? visibleRegions : regions)
                    .slice(0, 10)
                    .concat(
                      recommendations
                        .map((item) => regions.find((candidate) => candidate.id === item.regionId))
                        .filter((item): item is MapRegion => Boolean(item)),
                    )
                    .filter((region, index, arr) => arr.findIndex((item) => item.id === region.id) === index)
                }
                activeRegionId={selectedRegionId}
                onSelect={handleRegionSelect}
              />
              {recommendations.length ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recommendations.map((item) => (
                    <button
                      key={`m-rec-${item.regionId}`}
                      type="button"
                      onClick={() => {
                        const region = regions.find((candidate) => candidate.id === item.regionId);
                        if (region) handleRegionSelect(region);
                      }}
                      className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800"
                    >
                      {item.regionName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="h-[100dvh] min-h-[100dvh] z-0">
              <DiscoveryMap
                mapRef={mapRef}
                regions={regions}
                regionProjectCounts={regionProjectCounts}
                zoomStage={zoomStage}
                showHoverPreview={false}
                showZoomControl={false}
                hoveredRegionId={null}
                selectedRegionId={selectedRegionId}
                hoveredPreview={null}
                selectedPreview={null}
                onViewportChange={({ bounds, zoom: nextZoom }) => {
                  setViewportBounds(bounds);
                  setZoom(nextZoom);
                }}
                onHoverRegion={() => {}}
                onSelectRegion={handleRegionSelect}
              />
            </div>
          </div>
        )}
      </div>
      <MobileMapBottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedRegion={selectedRegion}
        visibleRegions={visibleRegions}
        visibleProjectCount={selectedRegionId === null ? visibleProjects.length : selectedRegionProjects.length}
        visibleNgoCount={visibleNgoCount}
        topCategories={topCategories}
        projects={selectedRegionProjects}
        onSelectRegion={handleRegionSelect}
        onViewProjects={() => {
          if (selectedRegion) {
            applyRegionToUrl(selectedRegion.name);
            router.push(`/bagislar?bolge=${encodeURIComponent(selectedRegion.name)}`);
            return;
          }
          router.push("/bagislar");
        }}
      />
    </main>
  );
}
