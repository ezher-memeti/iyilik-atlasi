import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getPublicVisibleCategoryIds,
  isPublicCategoryVisible,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

export type OrganizationCatalogItem = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  website: string;
  donationUrl: string;
  is_visible: boolean;
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

type RegionOptionRow = IdNameRow & {
  is_visible: boolean | null;
};

type CategoryOptionRow = IdNameRow & {
  parent_id: number | null;
  level: number | null;
  position: number | null;
  is_visible: boolean;
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
  is_visible?: boolean | null;
  logo_url?: string | null;
  category?: string | null;
  public_benefit?: string | null;
  sectors?: string | null;
  founded_year?: string | number | null;
  trust_score?: number | null;
  country_count?: number | null;
  focus_area?: string | null;
  ngo_bolge?: Array<{
    bolge:
      | { id: number; name: string; is_visible: boolean | null }
      | { id: number; name: string; is_visible: boolean | null }[]
      | null;
  }> | null;
};

type ProjectCategoryJoinRow = {
  ngo_id: number | null;
  project_bolge?: Array<{
    bolge: { id: number; is_visible: boolean | null } | { id: number; is_visible: boolean | null }[] | null;
  }> | null;
  project_categories:
    | Array<{ category: CategoryOptionRow | CategoryOptionRow[] | null }>
    | null;
};

function extractIdName<T extends { id: number; name: string }>(
  value: T | T[] | null | undefined,
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
        .filter((item): item is { id: number; name: string; is_visible: boolean | null } =>
          Boolean(item && item.is_visible !== false),
        )
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
    is_visible: row.is_visible ?? true,
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

  const ngoQuery = supabase
    .from("ngo")
    .select("*,ngo_bolge(bolge:bolge_id(id,name,is_visible))")
    .eq("is_visible", true);
  const orderedNgoQuery = isFiltering
    ? ngoQuery.order("id", { ascending: true })
    : ngoQuery.order("position", { ascending: true, nullsFirst: false });

  const [ngoResult, categoryResult, bolgeResult, projectCategoryResult] = await Promise.all([
    orderedNgoQuery,
    supabase
      .from("category")
      .select("id,name,parent_id,level,position,is_visible")
      .order("name", { ascending: true }),
    supabase
      .from("bolge")
      .select("id,name,is_visible")
      .eq("is_visible", true)
      .order("name", { ascending: true }),
    supabase
      .from("project")
      .select("ngo_id,ngo:ngo_id!inner(is_visible),project_bolge(bolge:bolge_id(id,is_visible)),project_categories(category:category_id(id,name,parent_id,level,position,is_visible))")
      .eq("is_visible", true)
      .eq("ngo.is_visible", true)
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

  const categoryRows = (categoryResult.data ?? []) as CategoryOptionRow[];
  const publicVisibleCategoryIds = getPublicVisibleCategoryIds(categoryRows as FlatCategory[]);
  const ngoCategoryMap = new Map<number, Map<number, string>>();
  for (const row of (projectCategoryResult.data ?? []) as ProjectCategoryJoinRow[]) {
    if (!row.ngo_id) continue;
    const regionRelations = row.project_bolge ?? [];
    const hasPublicRegionScope = regionRelations.length === 0 || regionRelations.some((item) => {
      const bolge = Array.isArray(item.bolge) ? item.bolge[0] ?? null : item.bolge;
      return bolge?.is_visible !== false;
    });
    if (!hasPublicRegionScope) continue;
    const existing = ngoCategoryMap.get(row.ngo_id) ?? new Map<number, string>();

    for (const joinRow of row.project_categories ?? []) {
      const category = extractIdName(joinRow.category);
      if (category && publicVisibleCategoryIds.has(category.id)) {
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
    categoryOptions: categoryRows.filter((category) =>
      isPublicCategoryVisible(category as FlatCategory, categoryRows as FlatCategory[]),
    ).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    regionOptions: ((bolgeResult.data ?? []) as RegionOptionRow[]).map((row) => ({
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
