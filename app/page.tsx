import Link from "next/link";
import { createSeoMetadata } from "@/components/SEO";

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

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <section className="relative -mx-4 overflow-hidden  px-4 py-14 sm:-mx-6 sm:px-6 sm:py-20 lg:-mx-8 lg:px-8 dark:">
        <p className="mx-auto w-fit px-1 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
          Şeffaf ve güven odaklı platform
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-emerald-50">
          Bağış kararını
          <span className="text-emerald-700 dark:text-emerald-300">
            {" "}
            sade, hızlı ve güvenli{" "}
          </span>
          şekilde ver.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-slate-500 sm:text-lg dark:text-slate-300">
          İyilik Atlası, kurumları ve bağış seçeneklerini aynı yerde sunarak en
          doğru tercihi yapmanı kolaylaştırır.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/organizations"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-6 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 sm:w-auto"
          >
            Kurumları İncele
          </Link>
          <Link
            href="/bagislar"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-700/35 bg-white/80 px-6 text-sm font-semibold text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-50/40 dark:border-emerald-300/35 dark:bg-white/[0.06] dark:text-emerald-100 dark:hover:bg-white/[0.12] sm:w-auto"
          >
            Bağış Seçeneklerini Gör
          </Link>
        </div>
      </section>

      <section className="mt-24 sm:mt-28">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
          Nasıl Çalışır?
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-emerald-50">
          Üç adımda net karar süreci
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <article key={step.title} className="relative">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                {step.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Adım {index + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-emerald-50">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-3xl bg-white px-4 py-14 sm:mt-28 sm:px-6 sm:py-16 dark:bg-white/[0.03] lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
          Neden İyilik Atlası?
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-emerald-50">
          Modern, sade ve güvenilir bir karşılaştırma deneyimi
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {highlights.map((item) => (
            <article key={item.title}>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-emerald-50">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
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
