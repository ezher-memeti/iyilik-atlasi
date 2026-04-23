"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import common from "@/content/common.json";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/organizations", label: "Kurumlar" },
  { href: "/bagislar", label: "Bağışlar" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled
          ? "border-black/5 bg-white/85 dark:border-white/10 dark:bg-black/55"
          : "border-black/5 bg-white/70 dark:border-white/10 dark:bg-black/40"
      }`}
    >
      <nav className="mx-auto grid h-16 w-full max-w-[1160px] grid-cols-[1fr_auto] items-center px-5 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-slate-900 dark:text-emerald-50"
          aria-label={common.brand}
        >
          <Image
            src="/Logo-1.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 object-contain"
          />
          <span className="brand-wordmark text-lg font-semibold tracking-tight sm:text-xl">
            <span className="text-slate-900 transition-colors group-hover:text-slate-700 dark:text-emerald-50 dark:group-hover:text-emerald-100">
              {common.brandParts.primary}
            </span>{" "}
            <span className="text-emerald-700 transition-colors group-hover:text-emerald-600 dark:text-emerald-300 dark:group-hover:text-emerald-200">
              {common.brandParts.secondary}
            </span>
          </span>
        </Link>

        <div className="hidden items-center justify-center lg:flex">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative inline-flex py-2 text-sm font-medium transition-colors duration-200 ${
                      active
                        ? "text-slate-900 dark:text-white"
                        : "text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-emerald-500 transition-all duration-200 ${
                        active ? "w-full opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden justify-self-end lg:block">
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-black/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
        >
          <span className="sr-only">Menü</span>
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      <div
        className={`overflow-hidden border-t border-black/5 transition-all duration-300 dark:border-white/10 lg:hidden ${
          menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-[1160px] px-5 py-3 sm:px-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-flex w-full items-center justify-between py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "text-slate-900 dark:text-white"
                        : "text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {active ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 pt-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
