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

export default function HomePage() {
  const steps = [
    {
      title: "Kurumları İncele",
      description:
        "Organizasyonlar sayfasında kurumların açıklamalarını ve kuruluş bilgilerini tek tek incele.",
      icon: <InstitutionIcon />,
    },
    {
      title: "Bağış Seçeneklerini Karşılaştır",
      description:
        "Bağışlar sayfasında kurumlara ait kurban projelerini aynı ekranda fiyat ve içerik bazında kıyasla.",
      icon: <CompareIcon />,
    },
    {
      title: "Karşılaştırma Listeni Oluştur",
      description:
        "Sana uygun projeleri seç, listeye ekle ve detaylı karşılaştırma tablosunu hızlıca görüntüle.",
      icon: <ListIcon />,
    },
    {
      title: "Resmi Bağış Adresine Geç",
      description:
        "Karar verdiğinde doğrudan ilgili kurumun resmi bağış sayfasına yönlendiril ve işlemini güvenle tamamla.",
      icon: <ShieldIcon />,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm sm:p-10 dark:border-white/10 dark:from-emerald-950/30 dark:to-teal-950/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/40 blur-2xl dark:bg-emerald-500/20" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-300/40 blur-2xl dark:bg-teal-500/20" />
        <p className="relative text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Şeffaf ve güven odaklı platform
        </p>
        <h1 className="relative mt-3 max-w-4xl text-3xl font-bold tracking-tight text-emerald-950 sm:text-5xl dark:text-emerald-50">
          Kurban bağışında doğru tercihi birkaç adımda yap.
        </h1>
        <p className="relative mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg dark:text-slate-300">
          İyilik Atlası, kurum bilgilerini ve bağış seçeneklerini tek yerde
          toplayarak karar sürecini kolaylaştırır. Veri değiştirilmeden,
          yalnızca karşılaştırma ve yönlendirme amacıyla sunulur.
        </p>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link
            href="/organizations"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-offset-slate-950"
          >
            Organizasyonları İncele
          </Link>
          <Link
            href="/bagislar"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700/20 bg-white/70 px-5 text-sm font-semibold text-emerald-900 transition hover:bg-white dark:border-emerald-300/40 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/15"
          >
            Bağış Seçeneklerine Git
          </Link>
        </div>
        <div className="relative mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3 dark:text-slate-300">
          <p className="rounded-lg border border-emerald-900/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            4 kurum tek ekranda
          </p>
          <p className="rounded-lg border border-emerald-900/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            Birden fazla kurban türü
          </p>
          <p className="rounded-lg border border-emerald-900/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            Resmi sitelere doğrudan yönlendirme
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-900/10 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-white/[0.06]">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Adım adım kullanım
        </p>
        <h2 className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50 sm:text-3xl">
          Sistem Nasıl Çalışır?
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-xl border border-emerald-900/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
                  {step.icon}
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Adım {index + 1}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-emerald-950 dark:text-emerald-50">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-emerald-900/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
            Veri Bütünlüğü
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Kurum ve proje verileri olduğu gibi korunur, yalnızca anlaşılır bir
            karşılaştırma deneyimi sunulur.
          </p>
        </article>
        <article className="rounded-xl border border-emerald-900/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
            Hızlı Karar
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Kurumları ve fiyatları aynı düzende görerek vakit kaybetmeden sana
            uygun bağış seçeneğini belirleyebilirsin.
          </p>
        </article>
        <article className="rounded-xl border border-emerald-900/10 bg-white/85 p-5 dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
            Güvenli Yönlendirme
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Platform ödeme almaz; bağış için sadece ilgili kurumların resmi
            bağlantılarına yönlendirir.
          </p>
        </article>
      </section>
    </main>
  );
}

function InstitutionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M3 10.5L12 5l9 5.5" />
      <path d="M5.5 10.5v7.5M10 10.5v7.5M14 10.5v7.5M18.5 10.5v7.5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M4 6h8M4 12h8M4 18h8" />
      <path d="M14 7l2-2 4 4-4 4-2-2" />
      <path d="M14 17l2 2 4-4-4-4-2 2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M5 7h14M5 12h14M5 17h14" />
      <path d="M3 7h.01M3 12h.01M3 17h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 3l7 3v6c0 4.4-2.7 7.9-7 9-4.3-1.1-7-4.6-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
