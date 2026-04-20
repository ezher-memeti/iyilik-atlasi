import common from "@/content/common.json";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/kurban";

type ProjectCardProps = {
  project: KurbanProjectWithOrganization;
  selected?: boolean;
  onToggle?: (projectId: string) => void;
  compactOnMobile?: boolean;
};

export function ProjectCard({
  project,
  selected = false,
  onToggle,
  compactOnMobile = false,
}: ProjectCardProps) {
  return (
    <article
      className={`rounded-lg border bg-white/85 p-4 transition dark:bg-white/[0.06] sm:p-5 ${
        selected
          ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/15 dark:border-emerald-500 dark:bg-emerald-950/15"
          : "border-emerald-900/10 hover:border-emerald-300 dark:border-white/10 dark:hover:border-emerald-300/40"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {project.organization.name}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-emerald-950 dark:text-emerald-50">
            {project.title}
          </h3>
        </div>
        {onToggle ? (
          <label className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-900/10 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100 sm:w-fit sm:rounded-full sm:py-1.5 sm:text-xs">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(project.id)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            {common.labels.compare}
          </label>
        ) : null}
      </div>
      <div className="mt-5 rounded-md border border-emerald-900/10 bg-[#fbf8f0] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {common.labels.perKurbanPrice}
        </p>
        <p className="mt-1 text-xl font-bold text-emerald-950 dark:text-emerald-50">
          {formatPrice(project.price)}
        </p>
      </div>
      <p
        className={`mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300 ${
          compactOnMobile ? "hidden md:block" : ""
        }`}
      >
        {project.description}
      </p>
      <div className={`mt-5 ${compactOnMobile ? "hidden md:block" : ""}`}>
        <a
          href={project.donation_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950 sm:w-auto"
        >
          {common.buttons.donate}
        </a>
      </div>
    </article>
  );
}
