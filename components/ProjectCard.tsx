import common from "@/content/common.json";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeLink } from "@/components/SafeLink";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/donationModels";

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
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [project.organization.logoUrl, project.organization.slug]);

  const ngoInitials = project.organization.name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");

  return (
    <article
      className={`overflow-hidden rounded-2xl border p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
        selected
          ? "border-emerald-500 bg-emerald-500/8 ring-1 ring-emerald-500/35"
          : "border-slate-200/80 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <Link
            href={`/organizations/${project.organization.slug}`}
            className="group inline-flex min-w-0 items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:ring-offset-2"
            title={`${project.organization.name} profilini görüntüle`}
            aria-label={`${project.organization.name} profiline git`}
          >
            {project.organization.logoUrl && !logoLoadFailed ? (
              <img
                src={project.organization.logoUrl}
                alt={`${project.organization.name} logosu`}
                className="h-7 w-7 shrink-0 rounded-full border border-slate-200 bg-white object-contain p-0.5 transition group-hover:border-emerald-300 group-hover:shadow-sm sm:h-8 sm:w-8"
                loading="lazy"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800 transition group-hover:border-emerald-300 group-hover:bg-emerald-100 sm:h-8 sm:w-8"
              >
                {ngoInitials || "NG"}
              </span>
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 break-words text-[11px] font-semibold uppercase leading-4 tracking-wide text-emerald-700/90 underline-offset-2 transition group-hover:text-emerald-800 group-hover:underline sm:text-xs">
                {project.organization.name}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700/70 transition group-hover:text-emerald-800">
                Profili görüntüle
                <span aria-hidden="true" className="transition group-hover:translate-x-0.5">↗</span>
              </p>
            </div>
          </Link>

          <h3 className="mt-1.5 line-clamp-2 text-[17px] font-semibold leading-6 text-[#1F2937] sm:mt-2 sm:text-lg">
            {project.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2">
            {project.categories[0] ? (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 sm:px-2.5 sm:py-1 sm:text-xs">
                {project.categories[0].name}
              </span>
            ) : null}
            {project.regions?.map((region) => (
              <span
                key={`${project.id}-${region}`}
                className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 sm:px-2.5 sm:py-1 sm:text-xs"
              >
                {region}
              </span>
            ))}
          </div>
        </div>

        <div className="sm:w-[180px] sm:justify-self-end">
          <p className="text-left text-[26px] font-bold tracking-tight text-emerald-800 sm:text-right sm:text-2xl">
            {formatPrice(project.price)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 sm:mt-3 sm:grid sm:grid-cols-1 sm:justify-items-end sm:gap-2">
            <SafeLink
              href={project.donation_url}
              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:min-h-10 sm:w-[150px] sm:flex-none sm:px-4"
              disabledClassName="inline-flex min-h-9 flex-1 cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-3 text-sm font-semibold text-slate-600 sm:min-h-10 sm:w-[150px] sm:flex-none sm:px-4"
              invalidLabel={common.labels.invalidDonationLink}
            >
              {common.buttons.donate}
            </SafeLink>

            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(project.id)}
                className={`inline-flex min-h-9 flex-1 items-center justify-center rounded-md border px-3 text-sm font-semibold transition sm:min-h-10 sm:w-[150px] sm:flex-none sm:px-4 ${
                  selected
                    ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
                    : "border-emerald-700/35 bg-white text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                {selected ? "✓ Seçildi" : "+ Karşılaştır"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
