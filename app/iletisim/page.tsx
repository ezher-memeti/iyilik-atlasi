import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";

export const metadata: Metadata = {
  title: { absolute: "İletişim | İyilik Atlası" },
  description:
    "İyilik Atlası ile iletişime geçmek için e-posta kanalını kullanın.",
};

export default function ContactPage() {
  return (
    <ContentPageLayout
      eyebrow="Destek"
      title="İletişim"
      intro={
        <p>
          Öneri, geri bildirim veya iş birliği talepleriniz için bizimle e-posta
          üzerinden iletişime geçebilirsiniz.
        </p>
      }
      sections={[
        {
          title: "E-posta",
          body: (
            <p>
              Bize <a className="font-medium text-brand-primary hover:text-brand-secondary" href="mailto:info@iyilikatlasi.com.tr">info@iyilikatlasi.com.tr</a> adresinden ulaşabilirsiniz.
            </p>
          ),
        },
        {
          title: "Yanıt Süresi",
          body: (
            <p>
              Mesajlarınızı mümkün olan en kısa sürede değerlendirmeye çalışıyoruz.
            </p>
          ),
        },
      ]}
      updatedAt="06 Mayıs 2026"
    />
  );
}
