"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchResultItem = {
  type: "category" | "region" | "ngo" | "project";
  id: number;
  title: string;
  subtitle?: string;
  href: string;
};

type HeroUnifiedDiscoveryProps = {
};

function typeLabel(type: SearchResultItem["type"]) {
  if (type === "category") return "Kategori";
  if (type === "region") return "Bölge";
  if (type === "ngo") return "Kurum";
  return "Proje";
}

export function HeroUnifiedDiscovery({}: HeroUnifiedDiscoveryProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function search() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/discovery-search?q=${encodeURIComponent(debouncedQuery)}&limit=6`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results?: SearchResultItem[] };
        if (!cancelled) {
          setResults(data.results ?? []);
          setActiveIndex(-1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    search().catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {
      category: [],
      region: [],
      ngo: [],
      project: [],
    };
    for (const item of results) groups[item.type].push(item);
    return groups;
  }, [results]);

  const flattened = useMemo(() => {
    const order: SearchResultItem["type"][] = ["category", "region", "ngo", "project"];
    return order.flatMap((type) => groupedResults[type]);
  }, [groupedResults]);

  const isDropdownOpen = isFocused && (query.trim().length >= 2 || isLoading);

  function navigateToResult(item: SearchResultItem) {
    setIsFocused(false);
    setQuery(item.title);
    router.push(item.href);
  }

  return (
    <div ref={wrapperRef} className="mt-10 w-full max-w-3xl self-center">
      <div
        className={`rounded-2xl border bg-white/80 p-2.5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 ${
          isFocused
            ? "border-brand-primary/35 ring-4 ring-brand-primary/10"
            : "border-white/70 hover:border-brand-primary/20"
        }`}
      >
        <label className="flex items-center gap-3 px-2">
          <SearchIcon />
          <input
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (!flattened.length) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((prev) => (prev + 1) % flattened.length);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((prev) => (prev <= 0 ? flattened.length - 1 : prev - 1));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                if (activeIndex >= 0 && flattened[activeIndex]) {
                  navigateToResult(flattened[activeIndex]);
                  return;
                }
                router.push(`/bagislar?ara=${encodeURIComponent(query.trim())}`);
              }
            }}
            placeholder="Ne bağışı yapmak istiyorsunuz?"
            className="h-12 w-full bg-transparent text-[15px] text-text-primary placeholder:text-text-secondary/75 outline-none sm:h-13 sm:text-base"
            aria-label="Kurum, proje, kategori veya bölge ara"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setActiveIndex(-1);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-slate-100"
              aria-label="Aramayı temizle"
            >
              ×
            </button>
          ) : null}
        </label>
      </div>

      <div
        className={`origin-top transition-all duration-200 ${
          isDropdownOpen
            ? "pointer-events-auto mt-3 scale-100 opacity-100"
            : "pointer-events-none mt-0 scale-[0.98] opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-divider-softLight bg-white/95 shadow-[0_22px_48px_rgba(15,23,42,0.14)] backdrop-blur-md">
          {isLoading ? (
            <p className="px-4 py-4 text-sm text-text-secondary">Aranıyor...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-secondary">
              Sonuç bulunamadı. Farklı bir anahtar kelime deneyebilirsiniz.
            </p>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              {(Object.entries(groupedResults) as Array<
                [SearchResultItem["type"], SearchResultItem[]]
              >).map(([type, items]) => {
                if (!items.length) return null;
                return (
                  <div key={type} className="border-b border-divider-softLight/80 last:border-b-0">
                    <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      {typeLabel(type)}
                    </p>
                    <ul className="pb-2 pt-1">
                      {items.map((item) => {
                        const flattenedIndex = flattened.findIndex(
                          (candidate) => `${candidate.type}-${candidate.id}` === `${item.type}-${item.id}`,
                        );
                        const isActive = flattenedIndex === activeIndex;
                        return (
                          <li key={`${item.type}-${item.id}`}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(flattenedIndex)}
                              onClick={() => navigateToResult(item)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition ${
                                isActive ? "bg-emerald-50/80" : "hover:bg-slate-50"
                              }`}
                            >
                              <span>
                                <span className="block text-sm font-medium text-text-primary">{item.title}</span>
                                {item.subtitle ? (
                                  <span className="block text-xs text-text-secondary">{item.subtitle}</span>
                                ) : null}
                              </span>
                              <span className="text-xs font-medium text-brand-primary">Git</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5 text-brand-primary"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}
