import common from "@/content/common.json";
import comparison from "@/content/comparison.json";
import { formatPrice, type KurbanProjectWithOrganization } from "@/lib/kurban";

type ComparisonTableProps = {
  projects: KurbanProjectWithOrganization[];
};

export function ComparisonTable({ projects }: ComparisonTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-900/20 bg-white/70 p-6 text-sm text-slate-700 dark:border-emerald-300/30 dark:bg-white/[0.04] dark:text-slate-300">
        {comparison.empty}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white/85 dark:border-white/10 dark:bg-white/[0.06]">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">
          {comparison.title}
        </h2>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-md border border-emerald-900/10 bg-[#fbf8f0] p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {project.organization.name}
            </p>
            <h3 className="mt-2 text-base font-semibold text-emerald-950 dark:text-emerald-50">
              {project.title}
            </h3>
            <div className="mt-3 rounded-md border border-emerald-900/10 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                {comparison.headers.price}
              </p>
              <p className="mt-1 font-bold text-emerald-950 dark:text-emerald-50">
                {formatPrice(project.price)}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {project.description}
            </p>
            <a
              href={project.donation_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950"
            >
              {common.buttons.donate}
            </a>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-emerald-50/80 text-xs uppercase tracking-wide text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100">
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
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {projects.map((project) => (
              <tr key={project.id} className="align-top">
                <td className="px-4 py-4 font-semibold text-emerald-950 dark:text-emerald-50 sm:px-6">
                  {project.organization.name}
                </td>
                <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200 sm:px-6">
                  {project.title}
                </td>
                <td className="px-4 py-4 font-semibold text-emerald-950 dark:text-emerald-50 sm:px-6">
                  {formatPrice(project.price)}
                </td>
                <td className="max-w-xl px-4 py-4 leading-6 text-slate-700 dark:text-slate-300 sm:px-6">
                  {project.description}
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <a
                    href={project.donation_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-28 items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950"
                  >
                    {common.buttons.donate}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
