import { createClient } from "@/lib/supabase/server";
import {
  getPublicVisibleCategoryIds,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

export type ProjectListItem = {
  id: number;
  title: string;
  price: number | null;
  donation_url: string;
  is_visible: boolean;
  ngo: {
    id: number;
    name: string;
    is_visible: boolean;
    logo_url?: string | null;
  } | null;
  bolgeler: Array<{
    id: number;
    name: string;
    is_visible: boolean;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    level: number | null;
    is_visible: boolean;
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
  is_visible: boolean | null;
  ngo: { id: number; name: string; is_visible: boolean | null; logo_url?: string | null } | null;
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
      category: {
        id: number;
        name: string;
        slug: string;
        parent_id: number | null;
        level: number | null;
        is_visible: boolean;
      } | null;
    }>
  | null;
};

type ProjectCategoryItem = ProjectListItem["categories"][number];

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
      is_visible,
      ngo:ngo_id!inner (
        id,
        name,
        is_visible,
        logo_url
      ),
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
          slug,
          parent_id,
          level,
          is_visible
        )
      )
      `,
    )
    .eq("is_visible", true)
    .eq("ngo.is_visible", true);

  query = isFiltering
    ? query.order("id", { ascending: true })
    : query.order("position", { ascending: true, nullsFirst: false });

  const [projectResult, categoryResult] = await Promise.all([
    query,
    supabase
      .from("category")
      .select("id,name,slug,parent_id,level,position,is_visible"),
  ]);

  if (projectResult.error) {
    throw new Error(`Failed to fetch projects: ${projectResult.error.message}`);
  }
  if (categoryResult.error) {
    throw new Error(`Failed to fetch project categories: ${categoryResult.error.message}`);
  }


  const rows = (projectResult.data ?? []) as unknown as ProjectQueryRow[];
  const allCategories = (categoryResult.data ?? []) as ProjectCategoryItem[];
  const publicVisibleCategoryIds = getPublicVisibleCategoryIds(allCategories as FlatCategory[]);

  return rows
    .map((row) => {
      const regionRelations = row.project_bolge ?? [];
      const visibleRegions = Array.from(
        regionRelations
          .reduce((regionMap, joinRow) => {
            const bolge = Array.isArray(joinRow.bolge)
              ? joinRow.bolge[0] ?? null
              : joinRow.bolge;
            if (bolge && bolge.is_visible !== false) {
              regionMap.set(bolge.id, { ...bolge, is_visible: bolge.is_visible ?? true });
            }
            return regionMap;
          },
          new Map<number, { id: number; name: string; is_visible: boolean }>(),
        )
        .values(),
      );

      return {
        id: row.id,
        title: row.title,
        price: row.price,
        donation_url: row.donation_url,
        is_visible: row.is_visible ?? true,
        ngo: row.ngo
          ? {
              ...row.ngo,
              is_visible: row.ngo.is_visible ?? true,
            }
          : null,
        bolgeler: visibleRegions,
        hasPublicRegionScope: regionRelations.length === 0 || visibleRegions.length > 0,
        categories: (row.project_categories ?? [])
          .map((joinRow) => joinRow.category)
          .filter((category): category is {
            id: number;
            name: string;
            slug: string;
            parent_id: number | null;
            level: number | null;
            is_visible: boolean;
          } =>
            Boolean(category && publicVisibleCategoryIds.has(category.id)),
          ),
      };
    })
    .filter((project) => project.categories.length > 0 && project.hasPublicRegionScope)
    .map(({ hasPublicRegionScope: _hasPublicRegionScope, ...project }) => project);
}
