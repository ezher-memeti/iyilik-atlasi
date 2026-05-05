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
};

type GetOrganizationCatalogOptions = {
  isFiltering?: boolean;
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

function extractRegionName(
  bolge: { id: number; name: string } | { id: number; name: string }[] | null | undefined,
) {
  if (!bolge) return null;
  if (Array.isArray(bolge)) return bolge[0]?.name ?? null;
  return bolge.name;
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

function mapNgoRow(row: NgoRow): OrganizationCatalogItem {
  const shortDescription =
    row.short_description?.trim() || row.description?.trim() || "";
  const website = normalizePublicUrl(row.website_url || row.website);
  const donationUrl = normalizePublicUrl(row.donation_url) || website;

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
    territories: (row.ngo_bolge ?? [])
      .map((item) => extractRegionName(item.bolge))
      .filter((name): name is string => Boolean(name)),
  };
}

export async function getOrganizationCatalog(
  options: GetOrganizationCatalogOptions = {},
): Promise<OrganizationCatalogItem[]> {
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
  let query = supabase.from("ngo").select("*,ngo_bolge(bolge:bolge_id(id,name))");
  query = isFiltering
    ? query.order("id", { ascending: true })
    : query.order("position", { ascending: true, nullsFirst: false });
  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch ngo: ${error.message}`);
  }

  return ((data ?? []) as NgoRow[]).map(mapNgoRow);
}

export async function getOrganizationBySlug(slug: string) {
  const organizations = await getOrganizationCatalog();
  return organizations.find((organization) => organization.slug === slug);
}
