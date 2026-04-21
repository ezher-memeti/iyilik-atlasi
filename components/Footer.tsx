import common from "@/content/common.json";

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/10 bg-[#f7f3ea]/80 dark:border-white/10 dark:bg-[#08130f]/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 dark:text-slate-400 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <p className="shrink-0">{common.footer.copyright}</p>
        <div className="space-y-1 md:max-w-2xl md:text-right">
          <p>{common.trust.noPayment}</p>
          <p>{common.trust.officialDescriptions}</p>
        </div>
      </div>
    </footer>
  );
}
