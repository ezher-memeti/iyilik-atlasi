import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  projects:
    | Array<{
        id: number;
        title: string;
        price: number | null;
        donation_url: string | null;
        project_bolge:
          | Array<{
              bolge: { id: number; name: string } | { id: number; name: string }[] | null;
            }>
          | null;
        project_categories:
          | Array<{
              category: { id: number; name: string } | { id: number; name: string }[] | null;
            }>
          | null;
      }>
    | null;
  ngo_bolge:
    | Array<{
        bolge: { id: number; name: string } | { id: number; name: string }[] | null;
      }>
    | null;
};

type NgoProfileData = {
  ngo: {
    id: number;
    name: string;
    description: string | null;
    website_url: string | null;
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

  const { data, error } = await supabase
    .from("ngo")
    .select(
      `
      id,
      name,
      description,
      website_url,
      projects:project (
        id,
        title,
        price,
        donation_url,
        project_bolge (
          bolge:bolge_id (
            id,
            name
          )
        ),
        project_categories (
          category:category_id (
            id,
            name
          )
        )
      ),
      ngo_bolge (
        bolge:bolge_id (
          id,
          name
        )
      )
      `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as NgoQueryRow;
  const projects = (row.projects ?? []).map((project) => {
    const regions = Array.from(
      new Set(
        (project.project_bolge ?? [])
          .map((item) => pickOne(item.bolge)?.name ?? null)
          .filter((name): name is string => Boolean(name)),
      ),
    );
    const categories = (project.project_categories ?? [])
      .map((item) => pickOne(item.category)?.name ?? null)
      .filter((name): name is string => Boolean(name));

    return {
      id: project.id,
      title: project.title,
      price: project.price,
      donation_url: project.donation_url,
      regions,
      categories: Array.from(new Set(categories)),
    };
  });

  const categories = Array.from(
    new Set(projects.flatMap((project) => project.categories).filter(Boolean)),
  );

  const regions = Array.from(
    new Set(
      (row.ngo_bolge ?? [])
        .map((item) => pickOne(item.bolge)?.name ?? null)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  return {
    ngo: {
      id: row.id,
      name: row.name,
      description: row.description,
      website_url: row.website_url,
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
                  {project.price !== null ? ` · Fiyat: ${formatCurrency(project.price)}` : ""}
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
