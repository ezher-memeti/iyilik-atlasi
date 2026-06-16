"use client";

import { AnimatePresence, motion } from "framer-motion";
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

const discoverySuggestions = ["Gazze", "Yetim", "Eğitim", "Su Kuyusu", "Acil Yardım", "Sağlık"];

function typeLabel(type: SearchResultItem["type"]) {
  if (type === "category") return "Kategori";
  if (type === "region") return "Bölge";
  if (type === "ngo") return "Kurum";
  return "Proje";
}

export function HeroUnifiedDiscovery({ }: HeroUnifiedDiscoveryProps) {
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

  const isQueryEmpty = query.trim().length === 0;
  const isPanelOpen = isFocused;
  const contentState = isQueryEmpty
    ? "suggestions"
    : isLoading
      ? "loading"
      : debouncedQuery.length < 2
        ? "typing"
        : results.length > 0
          ? "results"
          : "empty";

  function navigateToResult(item: SearchResultItem) {
    setIsFocused(false);
    setQuery(item.title);
    router.push(item.href);
  }

  function navigateToSearchTerm(term: string) {
    setIsFocused(false);
    setQuery(term);
    router.push(`/bagislar?ara=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={wrapperRef} className="relative z-20 mt-12 w-full max-w-3xl self-center">
      <div
        className={`rounded-2xl border bg-[rgba(255,255,255,0.82)] p-2.5 shadow-[0_18px_44px_rgba(15,23,42,0.10)] backdrop-blur-md transition-all duration-200 ${isFocused
          ? "border-[rgba(47,133,90,0.20)] shadow-[0_0_0_4px_rgba(47,133,90,0.08),0_18px_44px_rgba(15,23,42,0.10)]"
          : "border-white/70 hover:border-[rgba(47,133,90,0.16)]"
          }`}
      >
        <label className="flex items-center gap-3 px-2">
          <SearchIcon />
          <input
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                if (!flattened.length) return;
                event.preventDefault();
                setActiveIndex((prev) => (prev + 1) % flattened.length);
              }
              if (event.key === "ArrowUp") {
                if (!flattened.length) return;
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
            placeholder="Kurum, proje veya bölge ara..."
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

      <AnimatePresence>
        {isPanelOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute left-0 top-full mt-3 w-full overflow-hidden rounded-[24px] border border-[rgba(15,23,42,0.06)] bg-[rgba(255,255,255,0.85)] p-3 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          >
            <AnimatePresence mode="wait" initial={false}>
              {contentState === "suggestions" ? (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                >
                  <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Popüler Aramalar
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {discoverySuggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          navigateToSearchTerm(term);
                        }}
                        className="flex min-h-16 min-w-[132px] shrink-0 flex-col items-start justify-center rounded-xl border border-[rgba(15,23,42,0.06)] bg-white/55 px-4 text-left text-sm font-semibold text-text-primary shadow-sm transition-colors duration-150 hover:bg-[rgba(47,133,90,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:min-w-[150px]"
                      >
                        <span className="h-1 w-6 rounded-full bg-brand-primary/35" aria-hidden />
                        <span className="mt-2">{term}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {contentState === "loading" ? (
                <motion.p
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="px-3 py-4 text-sm text-text-secondary"
                >
                  Aranıyor...
                </motion.p>
              ) : null}

              {contentState === "typing" ? (
                <motion.p
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="px-3 py-4 text-sm text-text-secondary"
                >
                  Aramak için en az 2 karakter yazın.
                </motion.p>
              ) : null}

              {contentState === "empty" ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="px-3 py-4"
                >
                  <p className="text-sm font-semibold text-text-primary">Sonuç bulunamadı</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Farklı bir kurum, proje veya bölge deneyin.
                  </p>
                </motion.div>
              ) : null}

              {contentState === "results" ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="max-h-[min(420px,55vh)] overflow-y-auto"
                >
                  {(Object.entries(groupedResults) as Array<
                    [SearchResultItem["type"], SearchResultItem[]]
                  >).map(([type, items]) => {
                    if (!items.length) return null;
                    return (
                      <div key={type} className="pb-2">
                        <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                          {typeLabel(type)}
                        </p>
                        <ul className="space-y-1">
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
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    navigateToResult(item);
                                  }}
                                  className={`flex min-h-12 w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-left transition-colors duration-150 ${isActive
                                    ? "bg-[rgba(47,133,90,0.06)]"
                                    : "hover:bg-[rgba(47,133,90,0.06)]"
                                    }`}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-text-primary">
                                      {item.title}
                                    </span>
                                    {item.subtitle ? (
                                      <span className="block truncate text-xs text-text-secondary">
                                        {item.subtitle}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="shrink-0 text-xs font-semibold text-brand-primary">Git</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
