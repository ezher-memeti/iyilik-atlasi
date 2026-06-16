"use client";

import { Search } from "lucide-react";
import { RegionSearch } from "@/components/map/RegionSearch";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";

type MobileMapSearchProps = {
  regions: MapRegion[];
  projects: RegionProject[];
  onSelectRegion: (regionId: number) => void;
};

export function MobileMapSearch({ regions, projects, onSelectRegion }: MobileMapSearchProps) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
        <Search className="h-3.5 w-3.5" />
        Haritada Ara
      </div>
      <RegionSearch regions={regions} projects={projects} onSelectRegion={onSelectRegion} />
    </div>
  );
}
