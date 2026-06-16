"use client";

import { RegionSearch } from "@/components/map/RegionSearch";
import { RecommendationPanel } from "@/components/map/RecommendationPanel";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";
import type { RegionRecommendation } from "@/lib/map/recommendationUtils";

type DynamicSidebarProps = {
  title: string;
  visibleProjectCount: number;
  visibleNgoCount: number;
  topCategories: string[];
  visibleRegions: MapRegion[];
  projects: RegionProject[];
  recommendations: RegionRecommendation[];
  onSelectRegionId: (regionId: number) => void;
};

export function DynamicSidebar({
  title,
  visibleProjectCount,
  visibleNgoCount,
  topCategories,
  visibleRegions,
  projects,
  recommendations,
  onSelectRegionId,
}: DynamicSidebarProps) {
  return (
    <aside className="space-y-3 rounded-3xl border border-white/75 bg-white/95 p-3 backdrop-blur">
      <div className="rounded-2xl border border-divider-softLight bg-surface-pageLight p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Canlı Görünüm</p>
        <h3 className="mt-1 text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-xs text-text-secondary">{visibleRegions.length} görünür bölge</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white p-2">
            <p className="text-text-secondary">Projeler</p>
            <p className="text-base font-semibold text-text-primary">{visibleProjectCount}</p>
          </div>
          <div className="rounded-xl bg-white p-2">
            <p className="text-text-secondary">Kurumlar</p>
            <p className="text-base font-semibold text-text-primary">{visibleNgoCount}</p>
          </div>
        </div>
        {topCategories.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        {visibleRegions.length ? (
          <div className="mt-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
            {visibleRegions.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => onSelectRegionId(region.id)}
                className="rounded-full border border-divider-softLight bg-white px-2.5 py-1 text-[11px] text-text-secondary transition hover:border-emerald-200 hover:text-text-primary"
              >
                {region.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <RegionSearch
        regions={visibleRegions}
        projects={projects}
        onSelectRegion={onSelectRegionId}
      />

      <RecommendationPanel recommendations={recommendations} onSelect={onSelectRegionId} />
    </aside>
  );
}
