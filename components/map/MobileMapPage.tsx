"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { RegionProjectSheet } from "@/components/map/RegionProjectSheet";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";
import { useMapFilterSync } from "@/hooks/useMapFilterSync";
import { useRegionMapData } from "@/hooks/useRegionMapData";

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
  const { applyRegionToUrl } = useMapFilterSync();
  const mapRef = useRef<LeafletMap | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const { regionProjectMap, hoveredPreview } = useRegionMapData(regions, projects, hoveredRegionId);

  const selectedRegionProjects = useMemo(
    () => (selectedRegionId === null ? projects : regionProjectMap.get(selectedRegionId) ?? []),
    [projects, regionProjectMap, selectedRegionId],
  );

  function handleRegionSelect(region: MapRegion) {
    setSelectedRegionId(region.id);
    if (region.latitude !== null && region.longitude !== null) {
      mapRef.current?.flyTo([region.latitude, region.longitude], region.map_zoom ?? 4, {
        duration: 1,
      });
    }
    applyRegionToUrl(region.name);
  }

  return (
    <main className="fixed inset-0 z-[70] bg-surface-pageLight">
      <div className="absolute left-3 top-3 z-10">
        <Link
          href="/bagislar"
          className="inline-flex h-10 items-center justify-center rounded-full border border-white/70 bg-white/95 px-4 text-sm font-medium text-text-primary shadow-md backdrop-blur"
        >
          ← Bağışlara Dön
        </Link>
      </div>
      <div className="h-full w-full">
        {regions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-text-secondary">
            Harita verileri şu anda yüklenemedi.
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex gap-2 overflow-x-auto border-b border-divider-softLight bg-white/90 px-3 py-2 backdrop-blur">
              {regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleRegionSelect(region)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedRegionId === region.id
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-divider-softLight bg-white text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              <DiscoveryMap
                mapRef={mapRef}
                regions={regions}
                hoveredRegionId={hoveredRegionId}
                selectedRegionId={selectedRegionId}
                hoveredPreview={hoveredPreview}
                onHoverRegion={setHoveredRegionId}
                onSelectRegion={handleRegionSelect}
              />
            </div>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2">
        <div className="pointer-events-auto">
          <RegionProjectSheet
            title={regions.find((region) => region.id === selectedRegionId)?.name ?? "Tüm Bölgeler"}
            projects={selectedRegionProjects}
            mobile
            ctaLabel="Projeleri Gör"
            onCtaClick={() => {
              const selected = regions.find((region) => region.id === selectedRegionId);
              if (selected) {
                applyRegionToUrl(selected.name);
                router.push(`/bagislar?bolge=${encodeURIComponent(selected.name)}`);
                return;
              }
              router.push("/bagislar");
            }}
          />
        </div>
      </div>
    </main>
  );
}
