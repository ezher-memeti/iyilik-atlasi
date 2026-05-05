import { KurbanComparisonClient } from "@/components/KurbanComparisonClient";
import { createSeoMetadata } from "@/components/SEO";
import pages from "@/content/pages.json";
import { getCategories } from "@/lib/api/getCategories";
import { getRegions } from "@/lib/api/getRegions";
import { getAllProjects, getOrganizationGroups } from "@/lib/kurban";

export const metadata = createSeoMetadata({
  title: "Bağış Seçenekleri Karşılaştırma 2026 | Kategori Bazlı İnceleme",
  description:
    "İyilik Atlası ile farklı bağış kategorilerini tek sayfada karşılaştırın. Kurumlara göre seçenekleri inceleyin ve size uygun bağış türünü kolayca bulun.",
  keywords: [
    "bağış seçenekleri",
    "bağış kategorileri",
    "yardım kategorileri",
    "kurum bazlı bağış karşılaştırma",
    "bağış karşılaştırma 2026",
    "İyilik Atlası",
    "iyilikatlasi",
  ],
  url: "/bagislar",
});

export default async function DonationsPage() {
  const groups = await getOrganizationGroups();
  const projects = await getAllProjects();
  const categories = await getCategories();
  const regions = await getRegions();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-28 pt-8 sm:px-6 md:pb-10 lg:px-8">
      <section className="rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.14),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f6fbf7_100%)] px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Tüm bağış kategorileri
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
          Bağış Seçenekleri Karşılaştırması
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#6B7280]">
          Kurban, gıda, eğitim, su kuyusu ve yetim destek gibi farklı
          kategorilerdeki bağış seçeneklerini kurumlara göre tek ekranda
          inceleyin.
        </p>
      </section>

      <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-[#6B7280]">
        Bu platform bağış işlemi gerçekleştirmez. Seçtiğiniz projede bağış
        yapmak için ilgili kurumun resmi sayfasına yönlendirilirsiniz.
      </p>

      <KurbanComparisonClient
        groups={groups}
        projects={projects}
        categories={categories}
        regions={regions}
      />
    </main>
  );
}
