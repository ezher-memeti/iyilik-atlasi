import Link from "next/link";
import Image from "next/image";
import common from "@/content/common.json";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#f7f3ea]/90 backdrop-blur dark:border-white/10 dark:bg-[#08130f]/90">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 text-emerald-950 dark:text-emerald-50"
          aria-label={common.brand}
        >
          <Image
            src="/Logo-1.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-12 w-12 rounded-md object-contain"
          />
          <span className="brand-wordmark flex items-baseline gap-1 text-xl font-semibold leading-none tracking-normal sm:text-2xl">
            <span className="text-emerald-950 transition-colors group-hover:text-emerald-800 dark:text-emerald-50 dark:group-hover:text-emerald-100">
              {common.brandParts.primary}
            </span>
            <span className="font-medium text-teal-700 transition-colors group-hover:text-teal-600 dark:text-teal-300 dark:group-hover:text-teal-200">
              {common.brandParts.secondary}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 sm:gap-3">
          <div className="flex rounded-full border border-emerald-900/10 bg-white/75 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 transition hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-100"
            >
              {common.navigation.organizations}
            </Link>
            <Link
              href="/kurban"
              className="rounded-full px-3 py-1.5 transition hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-100"
            >
              {common.navigation.kurban}
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
