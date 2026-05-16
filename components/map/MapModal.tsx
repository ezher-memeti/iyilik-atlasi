"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { RegionProjectSheet } from "@/components/map/RegionProjectSheet";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";
import { useRegionMapData } from "@/hooks/useRegionMapData";

const DiscoveryMap = dynamic(
  () => import("@/components/map/DiscoveryMap").then((mod) => mod.DiscoveryMap),
  { ssr: false },
);

type MapModalProps = {
  isOpen: boolean;
  onClose: () => void;
  regions: MapRegion[];
  projects: RegionProject[];
  selectedRegionNames: string[];
  onApplyRegion: (regionName: string) => void;
  onToggleProject?: (projectId: string) => void;
  selectedProjectIds?: string[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

export function MapModal({
  isOpen,
  onClose,
  regions,
  projects,
  selectedRegionNames,
  onApplyRegion,
  onToggleProject,
  selectedProjectIds = [],
}: MapModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    modalRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const activeName = selectedRegionNames[0];
    if (!activeName) return;
    const active = regions.find((region) => normalize(region.name) === normalize(activeName));
    if (!active || active.latitude === null || active.longitude === null) return;
    setSelectedRegionId(active.id);
    mapRef.current?.flyTo([active.latitude, active.longitude], active.map_zoom ?? 4, {
      duration: 1.1,
    });
  }, [regions, selectedRegionNames]);

  const { regionProjectMap, hoveredPreview } = useRegionMapData(regions, projects, hoveredRegionId);

  const selectedRegionProjects = useMemo(() => {
    if (selectedRegionId === null) return projects;
    return regionProjectMap.get(selectedRegionId) ?? [];
  }, [projects, regionProjectMap, selectedRegionId]);

  const selectedRegionTitle = useMemo(() => {
    if (selectedRegionId === null) return "Tüm Bölgeler";
    return regions.find((region) => region.id === selectedRegionId)?.name ?? "Bölge";
  }, [regions, selectedRegionId]);

  function handleRegionSelect(region: MapRegion) {
    setSelectedRegionId(region.id);
    if (region.latitude !== null && region.longitude !== null) {
      mapRef.current?.flyTo([region.latitude, region.longitude], region.map_zoom ?? 4, {
        duration: 1,
      });
    }
    onApplyRegion(region.name);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden={!isOpen}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Haritada Keşfet"
            className="h-[92vh] w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/25 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.28)] outline-none"
            initial={{ opacity: 0, scale: 0.985, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <header className="flex items-center justify-between border-b border-divider-softLight px-4 py-3 sm:px-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Haritada Keşfet</p>
                  <h2 className="mt-1 text-base font-semibold text-text-primary sm:text-lg">
                    Projeleri bölgelere göre keşfedin
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-divider-softLight bg-white text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
                  aria-label="Harita modalını kapat"
                >
                  ×
                </button>
              </header>
              <div className="grid h-[calc(100%-78px)] grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-h-[360px] overflow-hidden rounded-3xl border border-divider-softLight">
                  {regions.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-text-secondary">
                      Harita verileri şu anda yüklenemedi.
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="flex gap-2 overflow-x-auto border-b border-divider-softLight px-3 py-2">
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
                <RegionProjectSheet
                  title={selectedRegionTitle}
                  projects={selectedRegionProjects}
                  onSelectProject={onToggleProject}
                  selectedProjectIds={selectedProjectIds}
                  ctaLabel="Projeleri Gör"
                  onCtaClick={onClose}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
