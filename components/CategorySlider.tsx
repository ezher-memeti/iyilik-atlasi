"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type CategoryItem = {
  title: string;
  description: string;
  href: string;
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

export function CategorySlider({ categories }: CategorySliderProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  const dotsCount = Math.max(1, categories.length - 2);

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
    if (!el?.firstElementChild) return 304;
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

  return (
    <div className="mt-12">
      <div className="relative mx-auto lg:max-w-[1020px]">
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Bağış kategorileri kaydırma alanı"
        >
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group w-[280px] min-w-[280px] snap-start rounded-2xl bg-surface-cardLight p-5 transition hover:-translate-y-0.5 hover:bg-white"
            >
              <h3 className="text-lg font-semibold text-text-primary">
                {cleanCategoryTitle(category.title)}
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {category.description}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold text-brand-primary transition group-hover:text-brand-secondary">
                Kategoriyi incele
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByDirection("left")}
          disabled={!canScrollLeft}
          className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-primary/25 bg-white/90 text-brand-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
          aria-label="Kategorileri sola kaydır"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => scrollByDirection("right")}
          disabled={!canScrollRight}
          className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-primary/25 bg-white/90 text-brand-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
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
                const target =
                  dotsCount <= 1 ? 0 : (index / (dotsCount - 1)) * max;
                el.scrollTo({ left: target, behavior: "smooth" });
              }}
              className={`h-2 rounded-full transition ${
                index === activeDot
                  ? "w-6 bg-brand-primary"
                  : "w-2 bg-brand-primary/30"
              }`}
              aria-label={`Konum ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/bagislar"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand-primary/35 px-6 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-surface-categoryLight"
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
