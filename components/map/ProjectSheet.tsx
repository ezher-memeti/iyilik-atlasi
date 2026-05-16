"use client";

import { motion } from "framer-motion";
import { ProjectCard } from "@/components/ProjectCard";
import type { RegionProject } from "@/components/map/mapTypes";

type ProjectSheetProps = {
  title: string;
  projects: RegionProject[];
  onSelectProject?: (projectId: string) => void;
  selectedProjectIds?: string[];
  mobile?: boolean;
};

export function ProjectSheet({
  title,
  projects,
  onSelectProject,
  selectedProjectIds = [],
  mobile = false,
}: ProjectSheetProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: mobile ? 0 : 16, y: mobile ? 24 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-3xl border border-white/75 bg-white/95 backdrop-blur ${
        mobile ? "h-[52vh] overflow-hidden" : "h-full overflow-hidden"
      }`}
    >
      <div className="border-b border-divider-softLight px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Bölge Keşfi</p>
        <h3 className="mt-1 text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-xs text-text-secondary">{projects.length} proje listeleniyor</p>
      </div>
      <div className="h-[calc(100%-82px)] space-y-3 overflow-y-auto p-3">
        {projects.map((project) => (
          <ProjectCard
            key={`map-sheet-${project.id}`}
            project={project}
            selected={selectedProjectIds.includes(project.id)}
            onToggle={onSelectProject}
          />
        ))}
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-divider-softLight bg-surface-pageLight px-3 py-4 text-sm text-text-secondary">
            Bu bölgede eşleşen proje bulunamadı.
          </p>
        ) : null}
      </div>
    </motion.aside>
  );
}
