import { KurbanComparisonClient } from "@/components/KurbanComparisonClient";
import { createSeoMetadata } from "@/components/SEO";
import pages from "@/content/pages.json";
import { getAllProjects, getOrganizationGroups } from "@/lib/kurban";

export const metadata = createSeoMetadata({
  title: "Bağış Seçenekleri Karşılaştırma 2026 | Kızılay, IHH, Diyanet",
  description:
    "İyilik Atlası ile Kızılay, IHH ve Diyanet kurban bağışı seçeneklerini tek sayfada karşılaştırın. Size uygun bağış türünü kurumlara göre inceleyin.",
  keywords: [
    "bağış seçenekleri",
    "kurban bağışı karşılaştırma",
    "kurban bağışı 2026",
    "Kızılay kurban bağışı",
    "IHH kurban bağışı",
    "Diyanet kurban bağışı",
    "İyilik Atlası",
    "iyilikatlasi",
  ],
  url: "/bagislar",
});

export default function DonationsPage() {
  const groups = getOrganizationGroups();
  const projects = getAllProjects();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-28 pt-8 sm:px-6 md:pb-10 lg:px-8">
      <section className="rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.14),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f6fbf7_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.16),transparent_50%),linear-gradient(180deg,#10201B_0%,#0B1210_100%)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          {pages.kurban.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl dark:text-[#E5E7EB]">
          {pages.kurban.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#6B7280] dark:text-[#9CA3AF]">
          {pages.kurban.description}
        </p>
      </section>

      <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-[#6B7280] dark:text-[#9CA3AF]">
        Bu platform bağış işlemi gerçekleştirmez. Seçtiğiniz projede bağış
        yapmak için ilgili kurumun resmi sayfasına yönlendirilirsiniz.
      </p>

      <KurbanComparisonClient groups={groups} projects={projects} />
    </main>
  );
}
