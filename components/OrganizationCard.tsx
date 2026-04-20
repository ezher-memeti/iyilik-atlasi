import Link from "next/link";
import common from "@/content/common.json";
import type { KurbanOrganization } from "@/lib/kurban";

type OrganizationCardProps = {
  organization: KurbanOrganization;
};

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-emerald-900/10 bg-white/85 p-5 transition hover:border-emerald-300 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-emerald-700">
      <div>
        <h2 className="text-xl font-semibold text-emerald-950 dark:text-emerald-50">
          {organization.name}
        </h2>
        {organization.founded ? (
          <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {common.labels.founded}: {organization.founded}
          </p>
        ) : null}
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {organization.description}
      </p>
      <Link
        href={`/organizations/${organization.slug}`}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950"
      >
        {common.buttons.details}
      </Link>
    </article>
  );
}
