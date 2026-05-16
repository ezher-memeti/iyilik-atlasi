import { createClient } from "@/lib/supabase/server";

export type ProjectListItem = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo: {
    id: number;
    name: string;
    logo_url?: string | null;
  } | null;
  bolgeler: Array<{
    id: number;
    name: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    level: number | null;
  }>;
};

type GetProjectsOptions = {
  isFiltering?: boolean;
};

type ProjectQueryRow = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  ngo: { id: number; name: string; logo_url?: string | null } | null;
  project_bolge:
    | Array<{
        bolge: { id: number; name: string } | { id: number; name: string }[] | null;
      }>
    | null;
  project_categories:
  | Array<{
      category: {
        id: number;
        name: string;
        slug: string;
        parent_id: number | null;
        level: number | null;
      } | null;
    }>
  | null;
};

export async function getProjects(options: GetProjectsOptions = {}): Promise<ProjectListItem[]> {
  const { isFiltering = false } = options;
  const supabase = await createClient();
  let query = supabase
    .from("project")
    .select(
      `
      id,
      title,
      price,
      donation_url,
      ngo:ngo_id (
        id,
        name,
        logo_url
      ),
      project_bolge (
        bolge:bolge_id (
          id,
          name
        )
      ),
      project_categories (
        category:category_id (
          id,
          name,
          slug,
          parent_id,
          level
        )
      )
      `,
    );

  query = isFiltering
    ? query.order("id", { ascending: true })
    : query.order("position", { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }


  const rows = (data ?? []) as unknown as ProjectQueryRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    donation_url: row.donation_url,
    ngo: row.ngo,
    bolgeler: Array.from(
      new Map(
        (row.project_bolge ?? [])
          .map((joinRow) => {
            const bolge = Array.isArray(joinRow.bolge)
              ? joinRow.bolge[0] ?? null
              : joinRow.bolge;
            return bolge ? [bolge.id, bolge] : null;
          })
          .filter((item): item is [number, { id: number; name: string }] => Boolean(item)),
      ).values(),
    ),
    categories: (row.project_categories ?? [])
      .map((joinRow) => joinRow.category)
      .filter((category): category is {
        id: number;
        name: string;
        slug: string;
        parent_id: number | null;
        level: number | null;
      } =>
        Boolean(category),
      ),
  }));
}
