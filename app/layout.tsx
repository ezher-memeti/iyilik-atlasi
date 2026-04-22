import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Navbar } from "@/components/Navbar";
import { StructuredData } from "@/components/StructuredData";
import { createSeoMetadata, siteUrl } from "@/components/SEO";
import pages from "@/content/pages.json";

export const metadata: Metadata = {
  ...createSeoMetadata({
    title: pages.metadata.title,
    description: pages.metadata.description,
    keywords: [
      "İyilik Atlası",
      "iyilikatlasi",
      "kurban bağışı",
      "bağış karşılaştırma",
      "kurban fiyatları",
    ],
    url: "/",
  }),
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      {
        url: "/logo.png",
        sizes: "1024x1024",
        type: "image/png",
      },
      {
        url: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/logo.png",
    apple: [
      {
        url: "/logo.png",
        sizes: "1024x1024",
        type: "image/png",
      },
      {
        url: "/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "İyilik Atlası",
  alternateName: "iyilikatlasi",
  url: siteUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <GoogleAnalytics measurementId="G-B8B8WXESWG" />
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <StructuredData data={websiteSchema} />
      </body>
    </html>
  );
}
