import { createClient } from "@/lib/supabase/server";

export type CategoryItem = {
  id: number;
  name: string;
  description: string | null;
};

type GetCategoriesOptions = {
  isFiltering?: boolean;
};

export async function getCategories(options: GetCategoriesOptions = {}): Promise<CategoryItem[]> {
  const { isFiltering = false } = options;
  const supabase = await createClient();
  let query = supabase.from("category").select("id,name,description");
  query = isFiltering
    ? query.order("id", { ascending: true })
    : query.order("position", { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return (data ?? []) as CategoryItem[];
}
