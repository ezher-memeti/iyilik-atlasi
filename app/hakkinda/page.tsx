import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: { absolute: "Hakkında | İyilik Atlası" },
  description:
    "İyilik Atlası'nın amacı, nasıl çalıştığı ve bağış kararlarını şeffaf karşılaştırma yaklaşımıyla nasıl desteklediği hakkında bilgi edinin.",
};

export default function AboutPage() {
  return (
    <ContentPageLayout
      eyebrow="Platform Hakkında"
      title="Hakkında"
      intro={
        <p>

        </p>
      }
      sections={[
        {
          title: "Biz Kimiz?",
          body: (
            <>
              <p>
                İyilik Atlası, Türkiye'deki bağışçılara kurumları ve bağış seçeneklerini şeffaf, karşılaştırmalı ve sade bir arayüzde sunmak amacıyla kurulmuş bağımsız bir dijital platformdur.
                Hangi kuruma bağış yapacağına karar verirken doğru bilgiye ulaşmak her zaman kolay değildir. İyilik Atlası, bu süreci basitleştirmek için tasarlandı.
              </p>
            </>
          ),
        },
        {
          title: "Ne Yapıyoruz?",
          body: (
            <>
              <p>
                Platform; dernekler, vakıflar ve insani yardım kuruluşlarının
                kurban, zekat, acil yardım, eğitim, sağlık ve daha pek çok
                kategori altındaki bağış seçeneklerini tek ekranda
                karşılaştırmanı sağlar.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Kurumları yaklaşım, odak alanı ve kuruluş bilgileriyle tanıtır
                </li>
                <li>Bağış seçeneklerini kategori bazlı listeler</li>
                <li>
                  Doğrudan ilgili kurumun resmi bağış sayfasına yönlendirir
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Ne Yapmıyoruz?",
          body: (
            <p>
              İyilik Atlası bir bağış aracısı değildir. Platform hiçbir ödeme
              işlemi gerçekleştirmez, bağış toplamaz ve finansal tavsiye vermez.
              Tüm bağış işlemleri ilgili kurumun resmi kanalları üzerinden
              tamamlanır.
            </p>
          ),
        },
        {
          title: "Neden İyilik Atlası?",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Tarafsız: Hiçbir kurumla ticari ortaklık veya sponsorluk
                ilişkimiz yoktur
              </li>
              <li>
                Şeffaf: Kurumlar hakkındaki bilgiler kamuya açık kaynaklardan
                derlenir
              </li>
              <li>
                Sade: Gereksiz karmaşa olmadan, karar sürecini destekleyen
                bilgiler öne çıkar
              </li>
            </ul>
          ),
        },
        {
          title: "İletişim",
          body: (
            <p>
              Her türlü öneri, hata bildirimi veya iş birliği talebi için:{" "}
              <a
                className="font-medium text-brand-primary hover:text-brand-secondary"
                href="mailto:info@iyilikatlasi.com.tr"
              >
                info@iyilikatlasi.com.tr
              </a>
            </p>
          ),
        },
      ]}
      updatedAt="Mayıs 2026"
    />
  );
}
