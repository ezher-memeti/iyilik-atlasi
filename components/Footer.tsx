import common from "@/content/common.json";

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/10 bg-[#f7f3ea]/80 dark:border-white/10 dark:bg-[#08130f]/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 dark:text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>{common.footer.copyright}</p>
        <p className="md:text-right">{common.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
