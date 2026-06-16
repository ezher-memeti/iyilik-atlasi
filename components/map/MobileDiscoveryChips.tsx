"use client";

import type { MapRegion } from "@/components/map/mapTypes";

type MobileDiscoveryChipsProps = {
  regions: MapRegion[];
  activeRegionId: number | null;
  onSelect: (region: MapRegion) => void;
};

export function MobileDiscoveryChips({ regions, activeRegionId, onSelect }: MobileDiscoveryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          onClick={() => onSelect(region)}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
            activeRegionId === region.id
              ? "border-emerald-300 bg-emerald-100 text-emerald-900"
              : "border-white/70 bg-white/95 text-text-secondary"
          }`}
        >
          {region.name}
        </button>
      ))}
    </div>
  );
}
