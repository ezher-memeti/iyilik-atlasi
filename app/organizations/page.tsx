import { Disclaimer } from "@/components/Disclaimer";
import { OrganizationCard } from "@/components/OrganizationCard";
import { createSeoMetadata } from "@/components/SEO";
import pages from "@/content/pages.json";
import { organizations } from "@/lib/kurban";

export const metadata = createSeoMetadata({
  title: "Organizasyonlar | İyilik Atlası",
  description:
    "Kurban bağışında yer alan kurumları İyilik Atlası üzerinden tek sayfada inceleyin. Kurum profilleri, açıklamalar ve proje detaylarını karşılaştırın.",
  keywords: [
    "organizasyonlar",
    "kurumlar",
    "kurban bağışı kurumları",
    "İyilik Atlası",
    "iyilikatlasi",
  ],
  url: "/organizations",
});

export default function OrganizationsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-lg border border-emerald-900/10 bg-white/85 p-6 sm:p-10 dark:border-white/10 dark:bg-white/[0.06]">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {pages.home.sectionEyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-emerald-950 sm:text-5xl dark:text-emerald-50">
          Bağış Yapacağınız Kurumu Tanıyın
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg dark:text-slate-300">
          Bu sayfada kurumların genel bilgilerini, açıklamalarını ve kurban
          çalışmalarıyla ilgili profillerini bir arada görebilirsiniz.
        </p>
      </section>

      <section>
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
