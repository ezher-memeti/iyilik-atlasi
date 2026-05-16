"use client";

import { motion } from "framer-motion";
import type { RegionPreview } from "@/components/map/mapTypes";

type RegionPopupProps = {
  preview: RegionPreview;
};

export function RegionPopup({ preview }: RegionPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-white/70 bg-white/95 px-3 py-2 shadow-[0_16px_32px_rgba(15,23,42,0.18)] backdrop-blur"
    >
      <p className="text-sm font-semibold text-text-primary">{preview.region.name}</p>
      <p className="mt-1 text-xs text-text-secondary">{preview.projectCount} proje</p>
      <p className="text-xs text-text-secondary">{preview.ngoCount} kurum</p>
    </motion.div>
  );
}
