"use client";

import { motion } from "framer-motion";
import type { RegionPreview } from "@/components/map/mapTypes";

type RegionPreviewCardProps = {
  preview: RegionPreview;
  topCategories: string[];
};

export function RegionPreviewCard({ preview, topCategories }: RegionPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="min-w-[190px] rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg"
    >
      <p className="text-sm font-semibold text-text-primary">{preview.region.name}</p>
      <p className="mt-1 text-xs text-text-secondary">{preview.projectCount} aktif proje</p>
      <p className="text-xs text-text-secondary">{preview.ngoCount} kurum</p>
      {topCategories.length > 0 ? (
        <p className="mt-1 line-clamp-2 text-[11px] text-emerald-800">
          {topCategories.join(" · ")}
        </p>
      ) : null}
    </motion.div>
  );
}
