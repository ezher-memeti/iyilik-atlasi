import { createClient } from "@/lib/supabase/server";

export type RegionItem = {
  id: number;
  name: string;
};

export async function getRegions(): Promise<RegionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bolge")
    .select("id,name")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch regions: ${error.message}`);
  }

  return (data ?? []) as RegionItem[];
}
