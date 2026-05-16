import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MaintenanceModeRedirect } from "@/components/MaintenanceModeRedirect";
import { Navbar } from "@/components/Navbar";
import { StructuredData } from "@/components/StructuredData";
import { siteUrl } from "@/components/SEO";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "İyilik Atlası",
    template: "%s | İyilik Atlası",
  },
  description:
    "İyilik Atlası ile bağış kurumlarını ve seçeneklerini şeffaf biçimde karşılaştırın.",
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
  const maintenanceRaw = process.env.MAINTENANCE_MODE ?? "";
  const isMaintenanceMode = maintenanceRaw.trim().toLowerCase() === "true";
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hideShell = isMaintenanceMode;

  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <MaintenanceModeRedirect isMaintenanceMode={isMaintenanceMode} />
        {!hideShell ? <GoogleAnalytics measurementId="G-B8B8WXESWG" /> : null}
        {!hideShell ? <Navbar /> : null}
        <div className="flex-1">{children}</div>
        {!hideShell ? <Footer /> : null}
        {!hideShell ? <StructuredData data={websiteSchema} /> : null}
        {!hideShell && measurementId ? <GoogleAnalytics measurementId={measurementId} /> : null}
      </body>
    </html>
  );
}
