import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: { absolute: "Kullanım Şartları | İyilik Atlası" },
  description:
    "İyilik Atlası kullanım koşulları, platformun bilgilendirme kapsamı ve kullanıcı sorumlulukları hakkında temel şartları inceleyin.",
};

export default function TermsPage() {
  return (
    <ContentPageLayout
      eyebrow="Yasal Bilgilendirme"
      title="Kullanım Şartları"
      intro={
        <p>
          Bu kullanım şartları, iyilikatlasi.com.tr adresinde sunulan
          hizmetlere erişim ve kullanım koşullarını düzenler. Platformu
          kullanarak bu şartları kabul etmiş sayılırsınız.
        </p>
      }
      sections={[
        {
          title: "Platformun Niteliği",
          body: (
            <>
              <p>
                İyilik Atlası, yalnızca bilgi sunma ve karşılaştırma amacıyla
                tasarlanmış bağımsız bir dijital platformdur. Platform:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Bağış işlemi gerçekleştirmez ve ödeme almaz</li>
                <li>
                  Finansal, hukuki veya dini danışmanlık hizmeti vermez
                </li>
                <li>Listelenen kurumları onaylamaz veya garanti etmez</li>
                <li>
                  Kurumlara yönlendirme yapar; sonraki tüm işlemler ilgili
                  kurumun sorumluluğundadır
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Sorumluluk Reddi",
          body: (
            <>
              <p>
                Platformda yer alan bilgiler kamuya açık kaynaklardan
                derlenmekte olup güncelliği ve doğruluğu konusunda azami özen
                gösterilmektedir. Ancak İyilik Atlası:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Listelenen kurumlardaki bağış süreçlerinden, ödeme
                  güvenliğinden veya kampanya içeriklerinden sorumlu tutulamaz
                </li>
                <li>
                  Kurumların faaliyetleri, finansal durumu veya etik
                  uygulamaları hakkında bağlayıcı bir değerlendirme yapmaz
                </li>
                <li>
                  Platform üzerinden erişilen üçüncü taraf web sitelerinin
                  içeriklerinden sorumlu değildir
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Kullanıcı Yükümlülükleri",
          body: (
            <>
              <p>Platformu kullananlar:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Platformu yalnızca yasal amaçlarla kullanmayı kabul eder</li>
                <li>
                  Sistemi bozmaya, veri çekmeye veya kötüye kullanmaya yönelik
                  girişimlerde bulunmayacağını taahhüt eder
                </li>
                <li>
                  Platform içeriğini ticari amaçla izinsiz çoğaltmayacağını
                  kabul eder
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Fikri Mülkiyet",
          body: (
            <p>
              Platform üzerindeki logo, tasarım, metin ve diğer içerikler
              İyilik Atlası&apos;na aittir. İzinsiz kullanım, kopyalama veya
              dağıtım yasaktır.
            </p>
          ),
        },
        {
          title: "Güncellemeler",
          body: (
            <p>
              İyilik Atlası, bu kullanım şartlarını önceden bildirimde
              bulunmaksızın güncelleme hakkını saklı tutar. Güncel şartlar her
              zaman platform üzerinde yayınlanır.
            </p>
          ),
        },
        {
          title: "İletişim",
          body: (
            <p>
              Bu şartlarla ilgili sorularınız için:{" "}
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
