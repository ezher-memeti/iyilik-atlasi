import common from "@/content/common.json";
import comparison from "@/content/comparison.json";
import { SafeLink } from "@/components/SafeLink";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/donationModels";

type ComparisonTableProps = {
  projects: KurbanProjectWithOrganization[];
  onRemove?: (projectId: string) => void;
};

export function ComparisonTable({ projects, onRemove }: ComparisonTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-900/20 bg-white/70 p-6 text-sm text-slate-700">
        {comparison.empty}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white/85">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-emerald-950">
          {comparison.title}
        </h2>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {projects.map((project) => (
          <article
            key={project.id}
            className="relative rounded-md border border-emerald-900/10 bg-[#fbf8f0] p-4 pr-12"
          >
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(project.id)}
                aria-label={common.labels.removeFromComparison}
                title={common.labels.removeFromComparison}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900/10 bg-white/85 text-lg font-semibold leading-none text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                ×
              </button>
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {project.organization.name}
            </p>
            <h3 className="mt-2 text-base font-semibold text-emerald-950">
              {project.title}
            </h3>
            <div className="mt-3 rounded-md border border-emerald-900/10 bg-white/85 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {comparison.headers.price}
              </p>
              <p className="mt-1 font-bold text-emerald-950">
                {formatPrice(project.price)}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {project.description}
            </p>
            <SafeLink
              href={project.donation_url}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white"
              disabledClassName="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-4 text-sm font-semibold text-slate-600"
              invalidLabel={common.labels.invalidDonationLink}
            >
              {common.buttons.donate}
            </SafeLink>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-emerald-50/80 text-xs uppercase tracking-wide text-emerald-900">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">
                {comparison.headers.organization}
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                {comparison.headers.projectTitle}
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                {comparison.headers.price}
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                {comparison.headers.description}
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                {comparison.headers.donate}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => (
              <tr key={project.id} className="align-top">
                <td className="px-4 py-4 font-semibold text-emerald-950 sm:px-6">
                  {project.organization.name}
                </td>
                <td className="px-4 py-4 font-medium text-slate-800 sm:px-6">
                  {project.title}
                </td>
                <td className="px-4 py-4 font-semibold text-emerald-950 sm:px-6">
                  {formatPrice(project.price)}
                </td>
                <td className="max-w-xl px-4 py-4 leading-6 text-slate-700 sm:px-6">
                  {project.description}
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <SafeLink
                      href={project.donation_url}
                      className="inline-flex min-w-28 items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      disabledClassName="inline-flex min-w-28 cursor-not-allowed items-center justify-center rounded-md bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
                      invalidLabel={common.labels.invalidDonationLink}
                    >
                      {common.buttons.donate}
                    </SafeLink>
                    {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(project.id)}
                      aria-label={common.labels.removeFromComparison}
                      title={common.labels.removeFromComparison}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/10 bg-white/85 text-lg font-semibold leading-none text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
                    >
                      ×
                    </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
