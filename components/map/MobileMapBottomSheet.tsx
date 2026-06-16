"use client";

import { Drawer } from "vaul";
import { RegionProjectSheet } from "@/components/map/RegionProjectSheet";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";

type MobileMapBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRegion: MapRegion | null;
  visibleRegions: MapRegion[];
  visibleProjectCount: number;
  visibleNgoCount: number;
  topCategories: string[];
  projects: RegionProject[];
  onSelectRegion: (region: MapRegion) => void;
  onViewProjects: () => void;
};

export function MobileMapBottomSheet({
  open,
  onOpenChange,
  selectedRegion,
  visibleRegions,
  visibleProjectCount,
  visibleNgoCount,
  topCategories,
  projects,
  onSelectRegion,
  onViewProjects,
}: MobileMapBottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[95] bg-slate-950/15" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[100] h-[74dvh] rounded-t-[24px] border border-white/70 bg-white/96 p-3 shadow-[0_-20px_50px_rgba(15,23,42,0.16)] outline-none">
          <Drawer.Title className="sr-only">Harita keşif sonuçları</Drawer.Title>
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-emerald-200" aria-hidden />
          <div className="h-[calc(74dvh-34px)] overflow-y-auto pr-1">
            <div className="rounded-2xl border border-divider-softLight bg-surface-pageLight p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Harita Özeti</p>
              <h3 className="mt-1 text-base font-semibold text-text-primary">
                {selectedRegion?.name ?? "Tüm Bölgeler"}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">{visibleProjectCount} proje bulundu</p>
              <p className="text-xs text-text-secondary">{visibleNgoCount} kurum görünür</p>
              {topCategories.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {topCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-900"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {!selectedRegion ? (
              <div className="mt-3 rounded-2xl border border-divider-softLight bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Öne Çıkan Bölgeler</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {visibleRegions.slice(0, 8).map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => onSelectRegion(region)}
                      className="min-h-11 rounded-xl border border-divider-softLight px-3 text-xs font-medium text-text-secondary"
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3">
              <RegionProjectSheet
                title={selectedRegion?.name ?? "Tüm Bölgeler"}
                projects={projects}
                mobile
                ctaLabel="Projeleri Gör"
                onCtaClick={onViewProjects}
              />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
