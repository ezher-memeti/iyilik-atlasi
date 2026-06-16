"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapRegion, RegionProject } from "@/components/map/mapTypes";

type RegionSearchProps = {
  regions: MapRegion[];
  projects: RegionProject[];
  onSelectRegion: (regionId: number) => void;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

export function RegionSearch({ regions, projects, onSelectRegion }: RegionSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalize(debouncedQuery.trim());
    if (!normalizedQuery) return [];

    const regionMatches = regions
      .filter((region) => normalize(region.name).includes(normalizedQuery))
      .slice(0, 4)
      .map((region) => ({ type: "region" as const, label: region.name, regionId: region.id }));

    const ngoMatches = Array.from(
      new Set(
        projects
          .filter((project) => normalize(project.organization.name).includes(normalizedQuery))
          .map((project) => project.organization.name),
      ),
    )
      .slice(0, 4)
      .map((ngoName) => {
        const firstProject = projects.find((project) => project.organization.name === ngoName);
        const firstRegionName = firstProject?.regions?.[0] ?? null;
        const mappedRegion = regions.find((region) => region.name === firstRegionName);
        return {
          type: "ngo" as const,
          label: ngoName,
          regionId: mappedRegion?.id ?? null,
        };
      });

    return [...regionMatches, ...ngoMatches].slice(0, 6);
  }, [debouncedQuery, projects, regions]);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
          Keşif Araması
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Bölge veya kurum ara..."
          className="h-10 w-full rounded-xl border border-divider-softLight bg-white px-3 text-sm text-text-primary outline-none transition focus:border-emerald-300"
        />
      </label>
      {suggestions.length > 0 ? (
        <div className="grid gap-1 rounded-xl border border-divider-softLight bg-white p-2">
          {suggestions.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={() => {
                if (item.regionId !== null) onSelectRegion(item.regionId);
              }}
              className="rounded-lg px-2 py-1 text-left text-xs text-text-secondary transition hover:bg-surface-categoryLight hover:text-text-primary"
            >
              <span className="font-medium">{item.label}</span>
              <span className="ml-1 opacity-70">{item.type === "region" ? "bölge" : "kurum"}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
