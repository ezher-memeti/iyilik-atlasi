import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import pages from "@/content/pages.json";

export const metadata: Metadata = {
  title: pages.metadata.title,
  description: pages.metadata.description,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('kurban-theme');
                  if (storedTheme !== 'light') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
