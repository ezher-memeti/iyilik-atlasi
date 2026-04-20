import Link from "next/link";
import pages from "@/content/pages.json";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">
        {pages.notFound.title}
      </h1>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        {pages.notFound.description}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300"
      >
        {pages.notFound.homeButton}
      </Link>
    </main>
  );
}
