"use client";

import { motion } from "framer-motion";

type MapDiscoveryCardProps = {
  onClick: () => void;
  mobile?: boolean;
};

export function MapDiscoveryCard({ onClick, mobile = false }: MapDiscoveryCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative w-full overflow-hidden rounded-2xl border border-emerald-200/70 px-4 py-3 text-left shadow-sm transition hover:shadow-md ${
        mobile ? "lg:hidden" : ""
      }`}
      aria-label="Haritada Keşfet"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{
          backgroundImage:
            "url('https://a.basemaps.cartocdn.com/light_all/3/4/2.png'), url('https://b.basemaps.cartocdn.com/light_all/3/5/2.png')",
          backgroundSize: "55% 100%, 55% 100%",
          backgroundPosition: "left center, right center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(130deg,rgba(244,251,247,0.95)_0%,rgba(233,246,238,0.90)_46%,rgba(255,255,255,0.94)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(5,150,105,0.13),transparent_45%)]"
      />
      <div aria-hidden className="absolute inset-0 bg-white/8 backdrop-blur-[1px]" />

      <div className="relative rounded-xl border border-white/75 bg-white/72 px-3 py-2 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/95 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
          <MapPinIcon />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-900">Haritada Keşfet</p>
          <p className="text-xs font-medium text-slate-700/95">Projeleri bölgelere göre keşfedin</p>
        </div>
      </div>
      </div>
    </motion.button>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.4" />
    </svg>
  );
}
