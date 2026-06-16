"use client";

import { motion } from "framer-motion";

type DiscoveryBubbleProps = {
  regionName: string;
  projectCount: number;
  ngoCount: number;
  active?: boolean;
  hovered?: boolean;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

export function DiscoveryBubble({
  regionName,
  projectCount,
  ngoCount,
  active = false,
  hovered = false,
  onClick,
  onHoverStart,
  onHoverEnd,
}: DiscoveryBubbleProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur ${
        active
          ? "border-emerald-500 bg-emerald-500/85 text-white"
          : hovered
            ? "border-emerald-400 bg-emerald-100/95 text-emerald-900"
            : "border-emerald-300/80 bg-white/95 text-emerald-800"
      }`}
      aria-label={`${regionName} bölgesi, ${projectCount} proje`}
    >
      <span>{regionName}</span>
      <span className="ml-1 opacity-85">· {projectCount}</span>
      <span className="ml-1 opacity-75">/{ngoCount}</span>
    </motion.button>
  );
}
