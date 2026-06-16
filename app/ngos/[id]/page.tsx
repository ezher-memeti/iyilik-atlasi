import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicVisibleCategoryIds,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

type NgoProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type NgoQueryRow = {
  id: number;
  name: string;
  description: string | null;
  website_url: string | null;
  is_visible: boolean | null;
  projects:
    | Array<{
        id: number;
        title: string;
        price: number | null;
        donation_url: string | null;
        is_visible: boolean | null;
        project_bolge:
          | Array<{
              bolge:
                | { id: number; name: string; is_visible: boolean | null }
                | { id: number; name: string; is_visible: boolean | null }[]
                | null;
            }>
          | null;
        project_categories:
          | Array<{
              category:
                | { id: number; name: string; parent_id: number | null; level: number | null; position: number | null; is_visible: boolean | null }
                | { id: number; name: string; parent_id: number | null; level: number | null; position: number | null; is_visible: boolean | null }[]
                | null;
            }>
          | null;
      }>
    | null;
  ngo_bolge:
    | Array<{
        bolge:
          | { id: number; name: string; is_visible: boolean | null }
          | { id: number; name: string; is_visible: boolean | null }[]
          | null;
      }>
    | null;
};

type NgoProfileData = {
  ngo: {
    id: number;
    name: string;
    description: string | null;
    website_url: string | null;
    is_visible: boolean;
  };
  projects: Array<{
    id: number;
    title: string;
    price: number | null;
    donation_url: string | null;
    regions: string[];
    categories: string[];
  }>;
  categories: string[];
  regions: string[];
  insights: string[];
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatCurrency(price: number | null) {
  if (price === null || Number.isNaN(price)) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function buildInsights(projects: NgoProfileData["projects"]) {
  const pairs = new Set<string>();

  for (const project of projects) {
    const regionsLabel = project.regions.length ? project.regions.join(", ") : "Belirtilmedi";
    if (!project.categories.length) {
      pairs.add(`Genel bağış projeleri ${regionsLabel} bölgesinde aktif`);
      continue;
    }

    for (const category of project.categories) {
      pairs.add(`${category} projeleri ${regionsLabel} bölgesinde aktif`);
    }
  }

  return Array.from(pairs);
}

async function getNgoProfileData(id: number): Promise<NgoProfileData | null> {
  const supabase = await createClient();

  const [ngoResult, categoryResult] = await Promise.all([
    supabase
    .from("ngo")
    .select(
      `
      id,
      name,
      description,
      website_url,
      is_visible,
      projects:project (
        id,
        title,
        price,
        donation_url,
        is_visible,
        project_bolge (
          bolge:bolge_id (
            id,
            name,
            is_visible
          )
        ),
        project_categories (
          category:category_id (
            id,
            name,
            parent_id,
            level,
            position,
            is_visible
          )
        )
      ),
      ngo_bolge (
        bolge:bolge_id (
          id,
          name,
          is_visible
        )
      )
      `,
    )
    .eq("id", id)
    .eq("is_visible", true)
    .eq("projects.is_visible", true)
    .single(),
    supabase
      .from("category")
      .select("id,name,parent_id,level,position,is_visible"),
  ]);

  if (ngoResult.error || !ngoResult.data || categoryResult.error) {
    return null;
  }

  const row = ngoResult.data as unknown as NgoQueryRow;
  const publicVisibleCategoryIds = getPublicVisibleCategoryIds(
    (categoryResult.data ?? []) as FlatCategory[],
  );
  const projects = (row.projects ?? []).filter((project) => project.is_visible !== false).map((project) => {
    const regionRelations = project.project_bolge ?? [];
    const regions = Array.from(
      new Set(
        regionRelations
          .map((item) => {
            const bolge = pickOne(item.bolge);
            return bolge?.is_visible !== false ? bolge?.name ?? null : null;
          })
          .filter((name): name is string => Boolean(name)),
      ),
    );
    const categories = (project.project_categories ?? [])
      .map((item) => pickOne(item.category))
      .filter((category): category is { id: number; name: string; parent_id: number | null; level: number | null; position: number | null; is_visible: boolean | null } =>
        Boolean(category && publicVisibleCategoryIds.has(category.id)),
      )
      .map((category) => category.name);

    return {
      id: project.id,
      title: project.title,
      price: project.price,
      donation_url: project.donation_url,
      regions,
      hasPublicRegionScope: regionRelations.length === 0 || regions.length > 0,
      categories: Array.from(new Set(categories)),
    };
  }).filter((project) => project.categories.length > 0 && project.hasPublicRegionScope);

  const categories = Array.from(
    new Set(projects.flatMap((project) => project.categories).filter(Boolean)),
  );

  const regions = Array.from(
    new Set(
      (row.ngo_bolge ?? [])
        .map((item) => {
          const bolge = pickOne(item.bolge);
          return bolge?.is_visible !== false ? bolge?.name ?? null : null;
        })
        .filter((name): name is string => Boolean(name)),
    ),
  );

  return {
    ngo: {
      id: row.id,
      name: row.name,
      description: row.description,
      website_url: row.website_url,
      is_visible: row.is_visible ?? true,
    },
    projects,
    categories,
    regions,
    insights: buildInsights(projects),
  };
}

export default async function NgoProfilePage({ params }: NgoProfilePageProps) {
  const { id } = await params;
  const ngoId = Number(id);

  if (Number.isNaN(ngoId)) {
    notFound();
  }

  const profile = await getNgoProfileData(ngoId);

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Kurum Profili
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1F2937]">{profile.ngo.name}</h1>
        <p className="mt-3 text-sm leading-7 text-[#6B7280]">
          {profile.ngo.description || "Belirtilmedi"}
        </p>
        <div className="mt-5">
          {profile.ngo.website_url ? (
            <a
              href={profile.ngo.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-700/35 px-4 text-sm font-semibold text-emerald-800"
            >
              Resmi siteyi ziyaret et
            </a>
          ) : (
            <p className="text-sm text-[#6B7280]">Belirtilmedi</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1F2937]">Genel Bakış</h2>
        <p className="mt-3 text-sm leading-7 text-[#6B7280]">
          {profile.ngo.description || "Belirtilmedi"}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1F2937]">Faaliyet alanı</h3>
          {profile.categories.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6B7280]">
              {profile.categories.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#6B7280]">Belirtilmedi</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1F2937]">Hizmet bölgeleri</h3>
          {profile.regions.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6B7280]">
              {profile.regions.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#6B7280]">Belirtilmedi</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1F2937]">Bağış Projeleri</h2>
        {profile.projects.length ? (
          <ul className="mt-5 space-y-3">
            {profile.projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-[#1F2937]">{project.title}</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {project.regions.length
                    ? `Bölge: ${project.regions.join(", ")}`
                    : "Bölge: Belirtilmedi"}
                  {project.price !== null ? ` · Tutar: ${formatCurrency(project.price)}` : ""}
                </p>
                {project.donation_url ? (
                  <a
                    href={project.donation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-emerald-700"
                  >
                    Bağış bağlantısı
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#6B7280]">Belirtilmedi</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#6B7280]">Belirtilmedi</p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1F2937]">Türetilmiş İçgörüler</h2>
        {profile.insights.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#6B7280]">
            {profile.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#6B7280]">Belirtilmedi</p>
        )}
      </section>
    </main>
  );
}
