"use client";

import { motion } from "framer-motion";
import type { RegionRecommendation } from "@/lib/map/recommendationUtils";

type RecommendationPanelProps = {
  recommendations: RegionRecommendation[];
  onSelect: (regionId: number) => void;
};

export function RecommendationPanel({ recommendations, onSelect }: RecommendationPanelProps) {
  if (!recommendations.length) return null;

  return (
    <section className="rounded-2xl border border-divider-softLight bg-white/90 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Önerilen Keşifler</p>
      <div className="mt-2 space-y-2">
        {recommendations.map((item) => (
          <motion.button
            key={item.regionId}
            type="button"
            onClick={() => onSelect(item.regionId)}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full rounded-xl border border-emerald-100 bg-emerald-50/55 px-3 py-2 text-left"
          >
            <p className="text-sm font-semibold text-emerald-900">{item.regionName}</p>
            <p className="text-xs text-emerald-800/90">{item.projectCount} proje · {item.reason}</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
