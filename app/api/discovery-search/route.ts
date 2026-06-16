import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicVisibleCategoryIds,
  isPublicCategoryVisible,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

type SearchResultItem = {
  type: "category" | "region" | "ngo" | "project";
  id: number;
  title: string;
  subtitle?: string;
  href: string;
};

function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const maintenanceRaw = process.env.MAINTENANCE_MODE ?? "";
  const isMaintenanceMode = maintenanceRaw.trim().toLowerCase() === "true";

  if (isMaintenanceMode) {
    return NextResponse.json(
      {
        error: "Servis bakımda. Lütfen daha sonra tekrar deneyin.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(8, Math.max(3, Number(searchParams.get("limit") ?? "6")));

    if (q.length < 2) {
      return NextResponse.json({ query: q, results: [] as SearchResultItem[] });
    }

    const pattern = `%${q}%`;
    const supabase = await createClient();

    const [allCategoryRes, categoryRes, regionRes, ngoRes, projectRes] = await Promise.all([
      supabase
        .from("category")
        .select("id,name,parent_id,level,position,is_visible"),
      supabase
        .from("category")
        .select("id,name,parent_id,level,position,is_visible")
        .ilike("name", pattern)
        .limit(limit),
      supabase
        .from("bolge")
        .select("id,name,is_visible")
        .ilike("name", pattern)
        .eq("is_visible", true)
        .limit(limit),
      supabase
        .from("ngo")
        .select("id,name,slug")
        .ilike("name", pattern)
        .eq("is_visible", true)
        .limit(limit),
      supabase
        .from("project")
        .select("id,title,ngo:ngo_id!inner(name,slug,is_visible),project_bolge(bolge:bolge_id(id,is_visible)),project_categories(category:category_id(id,name,parent_id,level,position,is_visible))")
        .ilike("title", pattern)
        .eq("is_visible", true)
        .eq("ngo.is_visible", true)
        .limit(limit),
    ]);

    if (allCategoryRes.error) {
      throw new Error(allCategoryRes.error.message);
    }
    const allCategories = (allCategoryRes.data ?? []) as FlatCategory[];
    const publicVisibleCategoryIds = getPublicVisibleCategoryIds(allCategories);

    const categoryResults: SearchResultItem[] = ((categoryRes.data ?? []) as FlatCategory[]).filter((item) =>
      isPublicCategoryVisible(item, allCategories),
    ).map((item) => ({
      type: "category",
      id: item.id,
      title: item.name,
      subtitle: "Kategori",
      href: `/bagislar?kategori=${encodeURIComponent(item.name)}`,
    }));

    const regionResults: SearchResultItem[] = (regionRes.data ?? []).map((item) => ({
      type: "region",
      id: item.id,
      title: item.name,
      subtitle: "Bölge",
      href: `/bagislar?bolge=${encodeURIComponent(item.name)}`,
    }));

    const ngoResults: SearchResultItem[] = (ngoRes.data ?? []).map((item) => ({
      type: "ngo",
      id: item.id,
      title: item.name,
      subtitle: "Kurum",
      href: `/kurumlar/${item.slug?.trim() || createSlug(item.name || `ngo-${item.id}`)}`,
    }));

    const projectResults: SearchResultItem[] = (projectRes.data ?? []).filter((item) => {
      const regionRelations = item.project_bolge ?? [];
      const hasPublicRegionScope = regionRelations.length === 0 || regionRelations.some((joinRow) => {
        const bolge = Array.isArray(joinRow.bolge) ? joinRow.bolge[0] : joinRow.bolge;
        return bolge?.is_visible !== false;
      });
      return hasPublicRegionScope && (item.project_categories ?? []).some((joinRow) => {
        const category = Array.isArray(joinRow.category) ? joinRow.category[0] : joinRow.category;
        return Boolean(category && publicVisibleCategoryIds.has(category.id));
      });
    }).map((item) => {
      const ngo = Array.isArray(item.ngo) ? item.ngo[0] : item.ngo;
      return {
        type: "project",
        id: item.id,
        title: item.title,
        subtitle: ngo?.name ? `Proje · ${ngo.name}` : "Proje",
        href: `/bagislar?ara=${encodeURIComponent(item.title)}`,
      };
    });

    const results = [
      ...categoryResults,
      ...regionResults,
      ...ngoResults,
      ...projectResults,
    ];

    const normalizedQuery = q.toLocaleLowerCase("tr-TR");
    if (!categoryResults.length && normalizedQuery.startsWith("kur")) {
      results.unshift({
        type: "category",
        id: -101,
        title: "Kurban",
        subtitle: "Kategori",
        href: `/bagislar?kategori=${encodeURIComponent("Kurban")}`,
      });
    }

    if (!regionResults.length && normalizedQuery.startsWith("gaz")) {
      results.unshift({
        type: "region",
        id: -102,
        title: "Gazze",
        subtitle: "Bölge",
        href: `/bagislar?bolge=${encodeURIComponent("Gazze")}`,
      });
    }

    if (!results.length) {
      results.push({
        type: "project",
        id: -999,
        title: `"${q}" için bağışlarda ara`,
        subtitle: "Keşif",
        href: `/bagislar?ara=${encodeURIComponent(q)}`,
      });
    }

    return NextResponse.json({ query: q, results: results.slice(0, 20) });
  } catch (error) {
    console.error("discovery-search api error", error);
    return NextResponse.json(
      {
        error: "Arama sırasında bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
