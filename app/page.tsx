import Link from "next/link";
import { CategorySlider } from "@/components/CategorySlider";
import { AnimatedStats } from "@/components/hero/AnimatedStats";
import { OrganizationsPageLink } from "@/components/OrganizationsPageLink";
import { getCategories } from "@/lib/api/getCategories";
import { getProjects } from "@/lib/api/getProjects";
import { getOrganizationCatalog } from "@/lib/organizationsCatalog";

export const metadata = {
  title: "Türkiye’nin Bağış Karşılaştırma Platformu",
  description:
    "İyilik Atlası ile bağış yapacağınız kurumları ve projeleri karşılaştırın. Şeffaf bilgilerle doğru kararı verin.",
};

const steps = [
  {
    title: "Kurumları Keşfet",
    description:
      "Kurumlar sayfasında kurumların yaklaşımını, kuruluş bilgilerini ve odak alanlarını kısa sürede gör.",
    icon: <SearchIcon />,
  },
  {
    title: "Bağış Seçeneklerini Kıyasla",
    description:
      "Bağışlar sayfasında projeleri tek ekranda karşılaştır, fiyat ve açıklamaları net biçimde incele.",
    icon: <CompareIcon />,
  },
  {
    title: "Güvenle Yönlen",
    description:
      "Kararını verip doğrudan ilgili kurumun resmi bağış bağlantısına geç ve işlemini tamamla.",
    icon: <ArrowIcon />,
  },
];

const highlights = [
  {
    title: "Tarafsız Karşılaştırma",
    description:
      "Tüm bilgiler sade bir düzende sunulur; karar süreci daha net ve daha hızlı olur.",
    icon: <BalanceIcon />,
  },
  {
    title: "Şeffaf Akış",
    description:
      "Platform ödeme almaz, yalnızca resmi kurum sayfalarına yönlendirme yapar.",
    icon: <ShieldIcon />,
  },
  {
    title: "Sade Deneyim",
    description:
      "Gereksiz karmaşa olmadan, bağış kararını destekleyen kritik bilgiler öne çıkar.",
    icon: <SparkIcon />,
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
            Bağış Platformu
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
            <OrganizationsPageLink
              href="/organizations"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-primary px-6 text-sm font-semibold text-white transition hover:bg-brand-secondary sm:w-auto"
            >
              Kurumları İncele
            </OrganizationsPageLink>
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
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-primary">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
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
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-primary">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M4 7h7M4 12h10M4 17h7" />
      <path d="M14 7l2-2 4 4-4 4-2-2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function BalanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 4v16" />
      <path d="M6 8h12" />
      <path d="M7.5 8l-3 5h6l-3-5z" />
      <path d="M16.5 8l-3 5h6l-3-5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 3l7 3v6c0 4.4-2.7 7.9-7 9-4.3-1.1-7-4.6-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" />
      <path d="M18.5 14l.8 2 .8-2 2-.8-2-.8-.8-2-.8 2-2 .8 2 .8z" />
    </svg>
  );
}
