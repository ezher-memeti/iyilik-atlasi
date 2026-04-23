import common from "@/content/common.json";
import { SafeLink } from "@/components/SafeLink";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/kurban";

type ProjectCardProps = {
  project: KurbanProjectWithOrganization;
  selected?: boolean;
  onToggle?: (projectId: string) => void;
  recommended?: boolean;
};

export function ProjectCard({
  project,
  selected = false,
  onToggle,
  recommended = false,
}: ProjectCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:shadow-none ${
        selected
          ? "border-emerald-500 bg-emerald-500/8 ring-1 ring-emerald-500/35 dark:border-emerald-400/70 dark:bg-emerald-400/14 dark:ring-emerald-400/35"
          : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {project.organization.name}
        </p>
        {recommended ? (
          <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
            Önerilen
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-lg font-semibold leading-7 text-[#1F2937] dark:text-[#E5E7EB]">
        {project.title}
      </h3>
      <p className="mt-4 text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
        {formatPrice(project.price)}
      </p>
      <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
        {project.description}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
        <SafeLink
          href={project.donation_url}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950 sm:w-auto"
          disabledClassName="inline-flex min-h-10 w-full cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-4 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 sm:w-auto"
          invalidLabel={common.labels.invalidDonationLink}
        >
          {common.buttons.donate}
        </SafeLink>

        {onToggle ? (
          <button
            type="button"
            onClick={() => onToggle(project.id)}
            className={`inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition sm:w-auto ${
              selected
                ? "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                : "border border-emerald-700/45 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-300/45 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-white/12"
            }`}
          >
            {selected ? "✓ Seçildi" : "+ Karşılaştır"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
