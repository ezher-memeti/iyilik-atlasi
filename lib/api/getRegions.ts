import { createClient } from "@/lib/supabase/server";

export type RegionItem = {
  id: number;
  name: string;
  slug?: string | null;
  latitude: number | null;
  longitude: number | null;
  map_zoom: number | null;
  geojson_url?: string | null;
  geojson?: unknown;
};

export async function getRegions(): Promise<RegionItem[]> {
  const supabase = await createClient();
  const primaryQuery = await supabase
    .from("bolge")
    .select("id,name,slug,latitude,longitude,map_zoom,geojson_url,geojson")
    .order("id", { ascending: true });

  if (!primaryQuery.error) {
    return (primaryQuery.data ?? []) as RegionItem[];
  }

  const fallbackWithoutSlug = await supabase
    .from("bolge")
    .select("id,name,latitude,longitude,map_zoom,geojson_url,geojson")
    .order("id", { ascending: true });

  if (!fallbackWithoutSlug.error) {
    return ((fallbackWithoutSlug.data ?? []) as Array<Omit<RegionItem, "slug">>).map((region) => ({
      ...region,
      slug: null,
    }));
  }

  const fallbackMinimal = await supabase
    .from("bolge")
    .select("id,name,latitude,longitude,map_zoom")
    .order("id", { ascending: true });

  if (fallbackMinimal.error) {
    throw new Error(`Failed to fetch regions: ${fallbackMinimal.error.message}`);
  }

  return ((fallbackMinimal.data ?? []) as Array<
    Omit<RegionItem, "slug" | "geojson_url" | "geojson">
  >).map((region) => ({
    ...region,
    slug: null,
    geojson_url: null,
    geojson: null,
  }));
}
