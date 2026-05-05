import Link from "next/link";
import { CategorySlider } from "@/components/CategorySlider";
import { AnimatedStats } from "@/components/hero/AnimatedStats";
import { createSeoMetadata } from "@/components/SEO";
import { getCategories } from "@/lib/api/getCategories";
import { getProjects } from "@/lib/api/getProjects";
import { getOrganizationCatalog } from "@/lib/organizationsCatalog";

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

const steps = [
  {
    title: "Kurumları Keşfet",
    description:
      "Kurumlar sayfasında kurumların yaklaşımını, kuruluş bilgilerini ve odak alanlarını kısa sürede gör.",
  },
  {
    title: "Bağış Seçeneklerini Kıyasla",
    description:
      "Bağışlar sayfasında projeleri tek ekranda karşılaştır, fiyat ve açıklamaları net biçimde incele.",
  },
  {
    title: "Güvenle Yönlen",
    description:
      "Kararını verip doğrudan ilgili kurumun resmi bağış bağlantısına geç ve işlemini tamamla.",
  },
];

const highlights = [
  {
    title: "Tarafsız Karşılaştırma",
    description:
      "Tüm bilgiler sade bir düzende sunulur; karar süreci daha net ve daha hızlı olur.",
  },
  {
    title: "Şeffaf Akış",
    description:
      "Platform ödeme almaz, yalnızca resmi kurum sayfalarına yönlendirme yapar.",
  },
  {
    title: "Sade Deneyim",
    description:
      "Gereksiz karmaşa olmadan, bağış kararını destekleyen kritik bilgiler öne çıkar.",
  },
];

export default async function HomePage() {
  const [categories, projects, ngos] = await Promise.all([
    getCategories(),
    getProjects(),
    getOrganizationCatalog(),
  ]);
  const categoryCards = categories.map((category) => ({
    title: category.name,
    description:
      category.description?.trim() ||
      "Bu kategoriye ait bağış seçeneklerini kurumlara göre inceleyin.",
    href: `/bagislar?kategori=${encodeURIComponent(category.name)}`,
  }));

  return (
    <>
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-hero-surface-light py-14 sm:py-20 lg:min-h-[78vh] lg:py-28">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col justify-center px-14 sm:px-20 lg:min-h-[50vh] lg:px-32">
          <p className="mx-auto w-fit px-1 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Şeffaf ve güven odaklı platform
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Bağış kararını
            <span className="text-brand-primary">
              {" "}
              sade, hızlı ve güvenli{" "}
            </span>
            şekilde ver.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-text-secondary sm:text-lg">
            İyilik Atlası, kurumları ve bağış seçeneklerini aynı yerde sunarak
            en doğru tercihi yapmanı kolaylaştırır.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/organizations"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-primary px-6 text-sm font-semibold text-white transition hover:bg-brand-secondary sm:w-auto"
            >
              Kurumları İncele
            </Link>
            <Link
              href="/bagislar"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand-primary/35 bg-white/80 px-6 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-surface-categoryLight sm:w-auto"
            >
              Bağış Seçeneklerini Gör
            </Link>
          </div>
          <AnimatedStats
            stats={[
              { label: "Proje", value: projects.length },
              { label: "Kurum", value: ngos.length },
              { label: "Kategori", value: categories.length },
            ]}
          />
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1160px] px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8">
        <section className="relative py-12 sm:py-14">
          <div className="py-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary">
              Kategoriler
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              Bağış alanlarını kategori bazlı keşfet
            </h2>

            <CategorySlider categories={categoryCards} />
          </div>
        </section>

        <section className="relative border-t border-divider-softLight py-12 sm:py-14">
          <div className="px-1 py-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary">
              Nasıl Çalışır?
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              Üç adımda net karar süreci
            </h2>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative flex flex-col items-center text-center md:items-start md:text-left"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Adım {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-divider-softLight py-12 sm:py-14">
          <div className="py-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary">
              Neden İyilik Atlası?
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              Modern, sade ve güvenilir bir karşılaştırma deneyimi
            </h2>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col items-center text-center md:items-start md:text-left"
                >
                  <h3 className="text-lg font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
