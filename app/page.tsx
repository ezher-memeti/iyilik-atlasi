import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { OrganizationCard } from "@/components/OrganizationCard";
import { createSeoMetadata } from "@/components/SEO";
import pages from "@/content/pages.json";
import { organizations } from "@/lib/kurban";

export const metadata = createSeoMetadata({
  title: "İyilik Atlası | Kurban Bağışı Karşılaştırma Platformu",
  description:
    "İyilik Atlası ile kurban bağışı seçeneklerini karşılaştırın. iyilikatlasi üzerinden Kızılay, IHH ve Diyanet kurban bağışlarını inceleyin ve en doğru seçimi yapın.",
  keywords: [
    "iyilik atlası",
    "iyilikatlasi",
    "kurban bağışı",
    "bağış karşılaştırma",
    "kurban fiyatları",
  ],
  url: "/",
});

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-lg border border-emerald-900/10 bg-white/85 p-6 sm:p-10 dark:border-white/10 dark:bg-white/[0.06]">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {pages.home.eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-emerald-950 sm:text-5xl dark:text-emerald-50">
          {pages.home.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg dark:text-slate-300">
          {pages.home.description}
        </p>
        <Link
          href="/kurban"
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950 sm:w-auto"
        >
          {pages.home.cta}
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {pages.home.sectionEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {pages.home.sectionTitle}
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {organizations.map((organization) => (
            <OrganizationCard
              key={organization.slug}
              organization={organization}
            />
          ))}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
