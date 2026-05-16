import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bakımdayız",
  description: "İyilik Atlası şu anda bakımda. Kısa süre içinde tekrar yayında olacağız.",
};

export default function MaintenancePage() {
  return (
    <main className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.10),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(15,23,42,0.06),transparent_35%),linear-gradient(180deg,#f7faf8_0%,#f4f7f6_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-14 sm:px-6 lg:px-8">
        <section className="w-full rounded-[30px] border border-white/60 bg-white/85 p-6 shadow-[0_20px_65px_rgba(16,24,40,0.10)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-50/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Planlı Bakım
            </span>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-5xl">
              İyilik Atlası kısa bir süreliğine bakımda
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Daha hızlı, daha stabil ve daha iyi bir keşif deneyimi için altyapı
              güncellemeleri yapıyoruz. Çalışmalar tamamlandığında platform yeniden
              erişime açılacak.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <InfoCard
              title="Güncelleme"
              description="Performans ve güvenilirlik iyileştirmeleri uygulanıyor."
            />
            <InfoCard
              title="Erişim"
              description="Bakım tamamlandığında tüm sayfalar yeniden aktif olacak."
            />
            <InfoCard
              title="İletişim"
              description={
                <>
                  Acil durumlar için bize{" "}
                  <a
                    href="mailto:info@iyilikatlasi.com.tr"
                    className="font-medium text-brand-primary underline-offset-2 transition hover:text-brand-secondary hover:underline"
                  >
                    info@iyilikatlasi.com.tr
                  </a>{" "}
                  adresinden ulaşabilirsiniz.
                </>
              }
            />
          </div>

          <div className="mt-8 border-t border-slate-200/70 pt-5 text-center">
            <p className="text-sm font-medium text-slate-500">
              Anlayışınız için teşekkür ederiz.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              İyilik Atlası Ekibi
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/75 bg-slate-50/70 px-4 py-3 text-left shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
    </article>
  );
}
