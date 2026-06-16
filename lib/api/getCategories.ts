import { createClient } from "@/lib/supabase/server";
import {
  isPublicCategoryVisible,
  sortCategories,
  type FlatCategory,
} from "@/lib/categoryHierarchy";

export type CategoryItem = FlatCategory;

type GetCategoriesOptions = {
  isFiltering?: boolean;
};

export async function getCategories(options: GetCategoriesOptions = {}): Promise<CategoryItem[]> {
  const { isFiltering = false } = options;
  const supabase = await createClient();
  const query = supabase.from("category").select(`
    id,
    name,
    slug,
    parent_id,
    level,
    position,
    is_visible,
    image_url
  `);
  const { data, error } = await query;


  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const rows = ((data ?? []) as CategoryItem[]).filter((category, _index, categories) =>
    isPublicCategoryVisible(category, categories),
  );
  if (isFiltering) {
    return [...rows].sort((a, b) => a.id - b.id);
  }
  return sortCategories(rows);
}
