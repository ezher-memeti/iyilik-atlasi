import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: { absolute: "Gizlilik Politikası | İyilik Atlası" },
  description:
    "İyilik Atlası'nın hangi verileri topladığı, bu verileri nasıl kullandığı ve kullanıcı gizliliğini nasıl koruduğu hakkında bilgi alın.",
};

export default function PrivacyPolicyPage() {
  return (
    <ContentPageLayout
      eyebrow="Yasal Bilgilendirme"
      title="Gizlilik Politikası"
      intro={
        <p>
          İyilik Atlası olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu politika, platformumuzu kullandığınızda hangi verilerin toplandığını, nasıl kullanıldığını ve haklarınızın neler olduğunu açıklar.
        </p>
      }
      sections={[
        {
          title: "Toplanan Veriler",
          body: (
            <>
              <p>
                Platform ziyaretleriniz sırasında aşağıdaki veriler teknik
                olarak işlenebilir:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Anonim kullanım istatistikleri (sayfa görüntüleme, tıklama
                  verileri)
                </li>
                <li>
                  Tarayıcı türü, ekran çözünürlüğü ve işletim sistemi bilgisi
                </li>
              </ul>
              <p>Teknik veriler analiz ve güvenlik amacıyla işlenebilir.</p>
              <p>
                İletişim formu veya e-posta yoluyla iletişime geçmeniz
                durumunda ad, e-posta adresi ve mesaj içeriği işlenebilir.
              </p>
            </>
          ),
        },
        {
          title: "Analitik Hizmetler",
          body: (
            <p>
              Platform, performans ve kullanım analizi amacıyla üçüncü taraf
              analitik araçları kullanabilir.
            </p>
          ),
        },
        {
          title: "Verilerin Kullanım Amacı",
          body: (
            <>
              <ul className="list-disc space-y-1 pl-5">
                <li>Platformun teknik işleyişini sürdürmek</li>
                <li>Kullanıcı deneyimini analiz etmek ve geliştirmek</li>
                <li>Kullanıcı taleplerine yanıt vermek</li>
              </ul>
              <p>Verileriniz üçüncü taraflara satılmaz veya ticari amaçla paylaşılmaz.</p>
            </>
          ),
        },
        {
          title: "Üçüncü Taraf Hizmetler",
          body: (
            <p>
              Platform, Google Analytics gibi üçüncü taraf analitik araçları
              kullanabilir. Bu araçların gizlilik politikaları kendi
              sağlayıcıları tarafından belirlenir.
            </p>
          ),
        },
        {
          title: "KVKK Kapsamındaki Haklarınız",
          body: (
            <>
              <p>
                6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında
                aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenen verilere ilişkin bilgi talep etme</li>
                <li>Verilerin düzeltilmesini veya silinmesini isteme</li>
                <li>İşlemeye itiraz etme</li>
              </ul>
              <p>
                Talepleriniz için:{" "}
                <a
                  className="font-medium text-brand-primary hover:text-brand-secondary"
                  href="mailto:info@iyilikatlasi.com.tr"
                >
                  info@iyilikatlasi.com.tr
                </a>
              </p>
            </>
          ),
        },
        {
          title: "Değişiklikler",
          body: (
            <p>
              Bu politika gerektiğinde güncellenebilir. Önemli değişiklikler
              platform üzerinden duyurulur.
            </p>
          ),
        },
      ]}
      updatedAt="Mayıs 2026"
    />
  );
}
