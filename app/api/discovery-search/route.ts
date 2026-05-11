import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(8, Math.max(3, Number(searchParams.get("limit") ?? "6")));

    if (q.length < 2) {
      return NextResponse.json({ query: q, results: [] as SearchResultItem[] });
    }

    const pattern = `%${q}%`;
    const supabase = await createClient();

    const [categoryRes, regionRes, ngoRes, projectRes] = await Promise.all([
      supabase.from("category").select("id,name").ilike("name", pattern).limit(limit),
      supabase.from("bolge").select("id,name").ilike("name", pattern).limit(limit),
      supabase.from("ngo").select("id,name,slug").ilike("name", pattern).limit(limit),
      supabase
        .from("project")
        .select("id,title,ngo:ngo_id(name,slug)")
        .ilike("title", pattern)
        .limit(limit),
    ]);

    const categoryResults: SearchResultItem[] = (categoryRes.data ?? []).map((item) => ({
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
      href: `/organizations/${item.slug?.trim() || createSlug(item.name || `ngo-${item.id}`)}`,
    }));

    const projectResults: SearchResultItem[] = (projectRes.data ?? []).map((item) => {
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
      },
      { status: 500 },
    );
  }
}
