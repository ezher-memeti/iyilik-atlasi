import { Disclaimer } from "@/components/Disclaimer";
import { KurbanComparisonClient } from "@/components/KurbanComparisonClient";
import { createSeoMetadata } from "@/components/SEO";
import pages from "@/content/pages.json";
import { getAllProjects, getOrganizationGroups } from "@/lib/kurban";

export const metadata = createSeoMetadata({
  title: "Kurban Bağışı Karşılaştırma 2026 | Kızılay, IHH, Diyanet",
  description:
    "İyilik Atlası ve iyilikatlasi ile Kızılay, IHH ve Diyanet kurban bağışı seçeneklerini karşılaştırın. Farklı kurban türlerini inceleyin ve size uygun olanı seçin.",
  keywords: [
    "kurban bağışı karşılaştırma",
    "kurban bağışı 2026",
    "Kızılay kurban bağışı",
    "IHH kurban bağışı",
    "Diyanet kurban bağışı",
    "İyilik Atlası",
    "iyilikatlasi",
  ],
  url: "/kurban",
});

export default function KurbanIndexPage() {
  const groups = getOrganizationGroups();
  const projects = getAllProjects();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-28 pt-8 sm:px-6 md:pb-8 lg:px-8">
      <section className="rounded-lg border border-emerald-900/10 bg-white/85 p-6 dark:border-white/10 dark:bg-white/[0.06]">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {pages.kurban.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl dark:text-emerald-50">
          {pages.kurban.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 dark:text-slate-300">
          {pages.kurban.description}
        </p>
      </section>

      <Disclaimer />

      <KurbanComparisonClient groups={groups} projects={projects} />
    </main>
  );
}
