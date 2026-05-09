"use client";

type FilterOption = {
  id: number;
  name: string;
};

type OrganizationFiltersPanelProps = {
  regionOptions: FilterOption[];
  categoryOptions: FilterOption[];
  selectedRegionIds: number[];
  selectedCategoryIds: number[];
  regionSearch: string;
  categorySearch: string;
  regionCounts: Record<number, number>;
  categoryCounts: Record<number, number>;
  onRegionSearchChange: (value: string) => void;
  onCategorySearchChange: (value: string) => void;
  onToggleRegion: (id: number) => void;
  onToggleCategory: (id: number) => void;
  titleClassName?: string;
};

function includesText(value: string, query: string) {
  const normalizedValue = value.toLocaleLowerCase("tr-TR");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  if (!normalizedQuery) return true;
  return normalizedValue.includes(normalizedQuery);
}

export function OrganizationFiltersPanel({
  regionOptions,
  categoryOptions,
  selectedRegionIds,
  selectedCategoryIds,
  regionSearch,
  categorySearch,
  regionCounts,
  categoryCounts,
  onRegionSearchChange,
  onCategorySearchChange,
  onToggleRegion,
  onToggleCategory,
  titleClassName = "text-sm font-semibold text-[#1F2937]",
}: OrganizationFiltersPanelProps) {
  const visibleRegions = regionOptions.filter((option) =>
    includesText(option.name, regionSearch),
  );
  const visibleCategories = categoryOptions.filter((option) =>
    includesText(option.name, categorySearch),
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-divider-softLight bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className={titleClassName}>Bölge Filtrele</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {selectedRegionIds.length} seçili
          </span>
        </div>
        <input
          type="text"
          value={regionSearch}
          onChange={(event) => onRegionSearchChange(event.target.value)}
          placeholder="Bölge ara..."
          className="mb-3 h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
        />
        <div className="max-h-56 space-y-1 overflow-auto pr-1">
          {visibleRegions.map((option) => {
            const checked = selectedRegionIds.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRegion(option.id)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {option.name}
                </span>
                <span className="text-xs text-text-secondary">{regionCounts[option.id] ?? 0}</span>
              </label>
            );
          })}
          {!visibleRegions.length ? (
            <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen bölge bulunamadı.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-divider-softLight bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className={titleClassName}>Kategori Filtrele</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {selectedCategoryIds.length} seçili
          </span>
        </div>
        <input
          type="text"
          value={categorySearch}
          onChange={(event) => onCategorySearchChange(event.target.value)}
          placeholder="Kategori ara..."
          className="mb-3 h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm text-text-primary outline-none transition focus:border-brand-primary"
        />
        <div className="max-h-56 space-y-1 overflow-auto pr-1">
          {visibleCategories.map((option) => {
            const checked = selectedCategoryIds.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(option.id)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {option.name}
                </span>
                <span className="text-xs text-text-secondary">{categoryCounts[option.id] ?? 0}</span>
              </label>
            );
          })}
          {!visibleCategories.length ? (
            <p className="px-2 py-1 text-xs text-text-secondary">Eşleşen kategori bulunamadı.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
