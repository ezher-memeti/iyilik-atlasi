export type FlatCategory = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  parent_id: number | null;
  level: number | null;
  position: number | null;
  image_url?: string | null;
};

export function sortCategories(categories: FlatCategory[]) {
  return [...categories].sort((a, b) => {
    const posA = a.position ?? Number.MAX_SAFE_INTEGER;
    const posB = b.position ?? Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return a.name.localeCompare(b.name, "tr");
  });
}

export function getPrimaryCategories(categories: FlatCategory[]) {
  return sortCategories(categories).filter((category) => category.parent_id === null);
}

export function getDirectChildren(categories: FlatCategory[], parentId: number) {
  return sortCategories(categories).filter((category) => category.parent_id === parentId);
}

export function getDescendantCategoryIds(categories: FlatCategory[], parentId: number) {
  const childrenByParent = new Map<number, number[]>();
  for (const category of categories) {
    if (category.parent_id === null) continue;
    const existing = childrenByParent.get(category.parent_id) ?? [];
    existing.push(category.id);
    childrenByParent.set(category.parent_id, existing);
  }

  const visited = new Set<number>();
  const queue = [parentId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || visited.has(current)) continue;
    visited.add(current);
    const children = childrenByParent.get(current) ?? [];
    for (const child of children) queue.push(child);
  }

  return visited;
}

export function getCategoryAncestors(categories: FlatCategory[], categoryId: number) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const ancestors: FlatCategory[] = [];
  let current = byId.get(categoryId) ?? null;
  const guard = new Set<number>();

  while (current && current.parent_id !== null) {
    if (guard.has(current.id)) break;
    guard.add(current.id);
    const parent = byId.get(current.parent_id) ?? null;
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

export function buildProjectCategoryIds(primaryId: number, selectedChildIds: number[]) {
  return Array.from(new Set([primaryId, ...selectedChildIds]));
}

export function buildExpandedCategoryIds(categories: FlatCategory[], selectedIds: number[]) {
  const expanded = new Set<number>();
  for (const categoryId of selectedIds) {
    expanded.add(categoryId);
    const ancestors = getCategoryAncestors(categories, categoryId);
    for (const ancestor of ancestors) {
      expanded.add(ancestor.id);
    }
  }
  return Array.from(expanded);
}
