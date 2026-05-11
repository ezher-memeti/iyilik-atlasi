import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type OrganizationCatalogItem = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  website: string;
  donationUrl: string;
  logoUrl: string;
  category?: string;
  publicBenefit?: string;
  sectors?: string;
  foundedYear?: string;
  trustScore?: number;
  countryCount?: number;
  focusArea?: string;
  territories?: string[];
  regionIds: number[];
  categoryIds: number[];
  categoryNames: string[];
};

export type OrganizationFilterOption = {
  id: number;
  name: string;
};

export type OrganizationCatalogData = {
  organizations: OrganizationCatalogItem[];
  regionOptions: OrganizationFilterOption[];
  categoryOptions: OrganizationFilterOption[];
};

type GetOrganizationCatalogOptions = {
  isFiltering?: boolean;
};

type IdNameRow = {
  id: number;
  name: string;
};

type NgoRow = {
  id: number;
  name: string;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  website_url?: string | null;
  website?: string | null;
  donation_url?: string | null;
  logo_url?: string | null;
  category?: string | null;
  public_benefit?: string | null;
  sectors?: string | null;
  founded_year?: string | number | null;
  trust_score?: number | null;
  country_count?: number | null;
  focus_area?: string | null;
  ngo_bolge?: Array<{ bolge: { id: number; name: string } | { id: number; name: string }[] | null }> | null;
};

type ProjectCategoryJoinRow = {
  ngo_id: number | null;
  project_categories:
    | Array<{ category: { id: number; name: string } | { id: number; name: string }[] | null }>
    | null;
};

function extractIdName(
  value: { id: number; name: string } | { id: number; name: string }[] | null | undefined,
) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePublicUrl(raw?: string | null) {
  const value = raw?.trim() ?? "";
  if (!value) return "";

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function mapNgoRow(
  row: NgoRow,
  ngoCategoryMap: Map<number, Map<number, string>>,
): OrganizationCatalogItem {
  const shortDescription =
    row.short_description?.trim() || row.description?.trim() || "";
  const website = normalizePublicUrl(row.website_url || row.website);
  const donationUrl = normalizePublicUrl(row.donation_url) || website;

  const regionEntries = Array.from(
    new Map(
      (row.ngo_bolge ?? [])
        .map((item) => extractIdName(item.bolge))
        .filter((item): item is { id: number; name: string } => Boolean(item))
        .map((item) => [item.id, item]),
    ).values(),
  );

  const categoryMap = ngoCategoryMap.get(row.id) ?? new Map<number, string>();

  return {
    id: row.id,
    name: row.name,
    slug: (row.slug?.trim() || createSlug(row.name || `ngo-${row.id}`)),
    shortDescription,
    website,
    donationUrl,
    logoUrl: row.logo_url?.trim() || "",
    category: row.category ?? undefined,
    publicBenefit: row.public_benefit ?? undefined,
    sectors: row.sectors ?? undefined,
    foundedYear: row.founded_year ? String(row.founded_year) : undefined,
    trustScore: row.trust_score ?? undefined,
    countryCount: row.country_count ?? undefined,
    focusArea: row.focus_area ?? undefined,
    territories: regionEntries.map((entry) => entry.name),
    regionIds: regionEntries.map((entry) => entry.id),
    categoryIds: Array.from(categoryMap.keys()),
    categoryNames: Array.from(categoryMap.values()),
  };
}

export async function getOrganizationCatalogData(
  options: GetOrganizationCatalogOptions = {},
): Promise<OrganizationCatalogData> {
  const { isFiltering = false } = options;
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const ngoQuery = supabase.from("ngo").select("*,ngo_bolge(bolge:bolge_id(id,name))");
  const orderedNgoQuery = isFiltering
    ? ngoQuery.order("id", { ascending: true })
    : ngoQuery.order("position", { ascending: true, nullsFirst: false });

  const [ngoResult, categoryResult, bolgeResult, projectCategoryResult] = await Promise.all([
    orderedNgoQuery,
    supabase.from("category").select("id,name").order("name", { ascending: true }),
    supabase.from("bolge").select("id,name").order("name", { ascending: true }),
    supabase
      .from("project")
      .select("ngo_id,project_categories(category:category_id(id,name))")
      .order("id", { ascending: true }),
  ]);

  if (ngoResult.error) {
    throw new Error(`Failed to fetch ngo: ${ngoResult.error.message}`);
  }
  if (categoryResult.error) {
    throw new Error(`Failed to fetch category options: ${categoryResult.error.message}`);
  }
  if (bolgeResult.error) {
    throw new Error(`Failed to fetch bolge options: ${bolgeResult.error.message}`);
  }
  if (projectCategoryResult.error) {
    throw new Error(`Failed to fetch ngo categories: ${projectCategoryResult.error.message}`);
  }

  const ngoCategoryMap = new Map<number, Map<number, string>>();
  for (const row of (projectCategoryResult.data ?? []) as ProjectCategoryJoinRow[]) {
    if (!row.ngo_id) continue;
    const existing = ngoCategoryMap.get(row.ngo_id) ?? new Map<number, string>();

    for (const joinRow of row.project_categories ?? []) {
      const category = extractIdName(joinRow.category);
      if (category) {
        existing.set(category.id, category.name);
      }
    }

    ngoCategoryMap.set(row.ngo_id, existing);
  }

  const organizations = ((ngoResult.data ?? []) as NgoRow[]).map((row) =>
    mapNgoRow(row, ngoCategoryMap),
  );

  return {
    organizations,
    categoryOptions: ((categoryResult.data ?? []) as IdNameRow[]).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    regionOptions: ((bolgeResult.data ?? []) as IdNameRow[]).map((row) => ({
      id: row.id,
      name: row.name,
    })),
  };
}

export async function getOrganizationCatalog(
  options: GetOrganizationCatalogOptions = {},
): Promise<OrganizationCatalogItem[]> {
  const data = await getOrganizationCatalogData(options);
  return data.organizations;
}

export async function getOrganizationBySlug(slug: string) {
  const organizations = await getOrganizationCatalog();
  return organizations.find((organization) => organization.slug === slug);
}
