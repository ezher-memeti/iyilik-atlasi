"use client";

import { motion } from "framer-motion";
import type { RegionPreview } from "@/components/map/mapTypes";

type RegionPreviewPopupProps = {
  preview: RegionPreview;
  visibleRegionCount?: number;
  topCategories?: string[];
};

export function RegionPreviewPopup({ preview, visibleRegionCount, topCategories = [] }: RegionPreviewPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="min-w-[150px] rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg"
    >
      <p className="text-sm font-semibold text-text-primary">{preview.region.name}</p>
      <p className="mt-1 text-xs text-text-secondary">{preview.projectCount} proje</p>
      <p className="text-xs text-text-secondary">{preview.ngoCount} kurum</p>
      {typeof visibleRegionCount === "number" ? (
        <p className="mt-1 text-[11px] text-emerald-800">{visibleRegionCount} görünür bölge içinde</p>
      ) : null}
      {topCategories.length ? (
        <p className="mt-1 max-w-[220px] text-[11px] text-emerald-900/90">{topCategories.join(" · ")}</p>
      ) : null}
    </motion.div>
  );
}
