import type { KurbanOrganization } from "@/lib/donationModels";
import common from "@/content/common.json";
import pages from "@/content/pages.json";
import { ProjectCard } from "@/components/ProjectCard";

type OrganizationDetailProps = {
  organization: KurbanOrganization;
};

export function OrganizationDetail({ organization }: OrganizationDetailProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-emerald-900/10 bg-white/85 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {pages.organization.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
          {organization.name}
        </h1>
        {organization.founded ? (
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {common.labels.foundedYear}: {organization.founded}
          </p>
        ) : null}
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
          {organization.description}
        </p>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {pages.organization.projectsEyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-emerald-950">
          {pages.organization.projectsTitle}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {organization.projects.map((project, projectIndex) => (
            <ProjectCard
              key={`${organization.slug}-${projectIndex}-${project.title}`}
              project={{
                ...project,
                id: `${organization.slug}-${projectIndex}-${project.type}-${project.title}`,
                categories: [],
                organization: {
                  id: 0,
                  name: organization.name,
                  slug: organization.slug,
                },
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
