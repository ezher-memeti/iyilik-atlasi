"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CategoryItem = {
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
};

type CategorySliderProps = {
  categories: CategoryItem[];
};

function cleanCategoryTitle(title: string) {
  const trimmed = title.trim();
  let index = 0;
  while (index < trimmed.length) {
    const ch = trimmed.charAt(index);
    if (/[A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(ch)) break;
    index += 1;
  }
  return trimmed.slice(index).trim();
}

function normalizeCategoryTitle(value: string) {
  return cleanCategoryTitle(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fallbackImageByCategory(title: string) {
  const normalized = normalizeCategoryTitle(title);
  if (normalized.includes("kurban")) return "/kurban.jpeg";
  if (normalized.includes("egitim")) return "/eğitim.png";
  return null;
}

export function CategorySlider({ categories }: CategorySliderProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const descriptionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [hasDescriptionOverflow, setHasDescriptionOverflow] = useState<Record<string, boolean>>({});
  const [isDescriptionAtBottom, setIsDescriptionAtBottom] = useState<Record<string, boolean>>({});

  const cards = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        resolvedImageUrl: category.imageUrl || fallbackImageByCategory(category.title),
      })),
    [categories],
  );

  const dotsCount = Math.max(1, cards.length - 2);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);
    if (max <= 0) {
      setActiveDot(0);
      return;
    }
    const ratio = el.scrollLeft / max;
    const nextDot = Math.round(ratio * (dotsCount - 1));
    setActiveDot(Math.min(dotsCount - 1, Math.max(0, nextDot)));
  }, [dotsCount]);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  const getScrollStep = () => {
    const el = scrollerRef.current;
    if (!el?.firstElementChild) return 360;
    const firstCard = el.firstElementChild as HTMLElement;
    const style = window.getComputedStyle(el);
    const gap = Number.parseFloat(style.columnGap || style.gap || "24");
    return firstCard.offsetWidth + (Number.isFinite(gap) ? gap : 24);
  };

  const scrollByDirection = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -getScrollStep() : getScrollStep(),
      behavior: "smooth",
    });
  };

  const updateDescriptionOverflowState = useCallback(() => {
    const overflowMap: Record<string, boolean> = {};
    const bottomMap: Record<string, boolean> = {};
    for (const card of cards) {
      const key = card.title;
      const el = descriptionRefs.current[key];
      if (!el) continue;
      const overflow = el.scrollHeight > el.clientHeight + 2;
      overflowMap[key] = overflow;
      bottomMap[key] = !overflow || el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    }
    setHasDescriptionOverflow(overflowMap);
    setIsDescriptionAtBottom(bottomMap);
  }, [cards]);

  useEffect(() => {
    updateDescriptionOverflowState();
    window.addEventListener("resize", updateDescriptionOverflowState);
    return () => window.removeEventListener("resize", updateDescriptionOverflowState);
  }, [updateDescriptionOverflowState]);

  return (
    <div className="mt-12">
      <div className="relative mx-auto lg:max-w-[1160px]">
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:gap-6 lg:gap-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Bağış kategorileri kaydırma alanı"
        >
          {cards.map((category) => {
            const title = cleanCategoryTitle(category.title);
            const hasOverflow = Boolean(hasDescriptionOverflow[category.title]);
            const atBottom = Boolean(isDescriptionAtBottom[category.title]);
            return (
              <Link
                key={category.title}
                href={category.href}
                className="group relative h-[236px] w-[82vw] min-w-[82vw] max-w-[360px] snap-start overflow-hidden rounded-[26px] bg-surface-cardDark transition duration-500 ease-out sm:w-[340px] sm:min-w-[340px]"
              >
                {category.resolvedImageUrl ? (
                  <Image
                    src={category.resolvedImageUrl}
                    alt={`${title} kategori görseli`}
                    fill
                    className="object-cover transition duration-500 ease-out will-change-transform group-hover:brightness-90"
                    sizes="(max-width: 640px) 82vw, 340px"
                  />
                ) : null}

                <div className="pointer-events-none absolute inset-0 bg-black/14 transition duration-500 ease-out group-hover:bg-black/20" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/44 to-transparent transition duration-500 ease-out group-hover:from-black/86 group-hover:via-black/52" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-black/24 to-transparent transition duration-500 ease-out group-hover:from-black/78 group-hover:via-black/30" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_85%_at_88%_12%,rgba(255,255,255,0.12),transparent_55%)] transition duration-500 ease-out group-hover:bg-[radial-gradient(125%_85%_at_88%_12%,rgba(255,255,255,0.08),transparent_55%)]" />

                <div className="relative z-10 flex h-full w-full flex-col px-5 pb-8 pt-10 sm:px-6 sm:pb-9 sm:pt-12">
                  <h3 className="min-h-[2.9rem] max-w-[18ch] text-[1.34rem] font-semibold tracking-tight text-white transition duration-500 ease-out">
                    {title}
                  </h3>
                  <div
                    ref={(el) => {
                      descriptionRefs.current[category.title] = el;
                    }}
                    onScroll={(event) => {
                      const el = event.currentTarget;
                      setIsDescriptionAtBottom((current) => ({
                        ...current,
                        [category.title]:
                          el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
                      }));
                    }}
                    className="relative mt-2 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <p className="w-full text-sm leading-6 text-white/90 transition duration-500 ease-out group-hover:text-white">
                      {category.description}
                    </p>
                    {hasOverflow && !atBottom ? (
                      <>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/85 to-transparent" />
                        <div className="pointer-events-none absolute bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-black/55 text-white/95">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-3.5 w-3.5 animate-pulse"
                            aria-hidden
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white transition duration-500 ease-out">
                    Kategoriyi incele
                    <span aria-hidden className="text-base leading-none">{">"}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollByDirection("left")}
          disabled={!canScrollLeft}
          className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-pageLight/90 text-brand-primary shadow-sm transition hover:bg-surface-pageLight disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
          aria-label="Kategorileri sola kaydır"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => scrollByDirection("right")}
          disabled={!canScrollRight}
          className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-pageLight/90 text-brand-primary shadow-sm transition hover:bg-surface-pageLight disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
          aria-label="Kategorileri sağa kaydır"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2" aria-label="Kaydırma konumu">
          {Array.from({ length: dotsCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                const el = scrollerRef.current;
                if (!el) return;
                const max = el.scrollWidth - el.clientWidth;
                const target = dotsCount <= 1 ? 0 : (index / (dotsCount - 1)) * max;
                el.scrollTo({ left: target, behavior: "smooth" });
              }}
              className={`h-2 rounded-full transition ${
                index === activeDot ? "w-6 bg-brand-primary" : "w-2 bg-brand-primary/30"
              }`}
              aria-label={`Konum ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/bagislar"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-primary/35 px-6 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-surface-categoryLight"
        >
          Tüm Kategorileri Gör
        </Link>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
