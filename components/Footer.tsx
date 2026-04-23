import Link from "next/link";
import common from "@/content/common.json";

const linkGroups = [
  {
    title: "Platform",
    links: [
      { label: "Ana Sayfa", href: "/" },
      { label: "Kurumlar", href: "/organizations" },
      { label: "Bağışlar", href: "/bagislar" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkında", href: "/hakkinda" },
      { label: "İletişim", href: "mailto:destek@iyilikatlasi.com" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "Kullanım Şartları", href: "/kullanim-sartlari" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-[#F4F7F5] dark:border-white/10 dark:bg-[#050A08]">
      <div className="mx-auto w-full max-w-[1160px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <section>
            <h2 className="brand-wordmark text-2xl font-semibold tracking-tight text-slate-900 dark:text-emerald-50">
              <span>{common.brandParts.primary}</span>{" "}
              <span className="text-emerald-700 dark:text-emerald-300">
                {common.brandParts.secondary}
              </span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-gray-600 dark:text-gray-400">
              Kurumları ve bağış seçeneklerini sade bir arayüzde karşılaştırarak
              güvenli ve bilinçli karar vermene yardımcı olur.
            </p>
          </section>

          <section className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 transition-colors duration-200 hover:text-black dark:text-gray-400 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className="mt-14 border-t border-black/5 pt-8 dark:border-white/10">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {common.footer.copyright}
            </p>
            <p className="mt-3 text-xs leading-6 text-gray-500 dark:text-gray-400">
              {common.footer.disclaimer}
            </p>
            <p className="mt-1 text-xs leading-6 text-gray-500 dark:text-gray-400">
              {common.trust.noPayment}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
