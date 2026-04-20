"use client";

import { useMemo, useState } from "react";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProjectCard } from "@/components/ProjectCard";
import common from "@/content/common.json";
import type { KurbanProjectWithOrganization } from "@/lib/kurban";

type OrganizationGroup = {
  organization: {
    name: string;
    slug: string;
    description?: string;
    founded?: string;
  };
  projects: KurbanProjectWithOrganization[];
};

type KurbanComparisonClientProps = {
  groups: OrganizationGroup[];
  projects: KurbanProjectWithOrganization[];
};

export function KurbanComparisonClient({
  groups,
  projects,
}: KurbanComparisonClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openOrganization, setOpenOrganization] = useState(
    groups[0]?.organization.slug ?? "",
  );

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.includes(project.id)),
    [projects, selectedIds],
  );

  function toggleProject(projectId: string) {
    setSelectedIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <>
      <div id="comparison" className="scroll-mt-24">
        <ComparisonTable projects={selectedProjects} />
      </div>

      <section className="space-y-3 md:space-y-7">
        {groups.map((group) => (
          <div
            key={group.organization.slug}
            className="rounded-lg border border-emerald-900/10 bg-white/85 dark:border-white/10 dark:bg-white/[0.06]"
          >
            <button
              type="button"
              onClick={() =>
                setOpenOrganization((current) =>
                  current === group.organization.slug ? "" : group.organization.slug,
                )
              }
              aria-expanded={openOrganization === group.organization.slug}
              aria-label={
                openOrganization === group.organization.slug
                  ? common.labels.collapseOrganization
                  : common.labels.expandOrganization
              }
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left"
            >
              <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-50 sm:text-xl">
                {group.organization.name}
              </h2>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100 sm:text-sm">
                  {group.projects.length} {common.labels.optionCountSuffix}
                </span>
                <span className="text-lg text-emerald-700 dark:text-emerald-300">
                  {openOrganization === group.organization.slug ? "−" : "+"}
                </span>
              </span>
            </button>
            <div
              className={`gap-4 px-4 pb-4 lg:grid-cols-2 ${openOrganization === group.organization.slug ? "grid" : "hidden"
                }`}
            >
              {group.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  selected={selectedIds.includes(project.id)}
                  onToggle={toggleProject}
                  compactOnMobile
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {selectedProjects.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-900/10 bg-[#f7f3ea]/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#08130f]/95 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                {selectedProjects.length} {common.labels.selectedCountSuffix}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="min-h-11 rounded-md border border-emerald-900/10 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
            >
              {common.buttons.clear}
            </button>
            <a
              href="#comparison"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950"
            >
              {common.labels.viewComparison}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
