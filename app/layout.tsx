import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { BviPlugin } from "@/components/BviPlugin";
import { BviRouteSync } from "@/components/BviRouteSync";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { onest } from "@/lib/fonts";
import { BVI_CSS_HREF, BVI_KRIMVK_CSS_HREF } from "@/lib/bvi-assets";
import { SITE_SHELL_CLASS } from "@/lib/bvi-constants";

export const metadata: Metadata = {
  title: "КрымВК - Водоканал Крыма",
  description: "Официальный сайт водоканала Крыма. Подача показаний счетчиков, оплата счетов, заявки на услуги.",
  icons: {
    icon: [
      { url: "/images/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={onest.variable}>
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/logo.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/logo.png" sizes="180x180" />
        <link rel="shortcut icon" href="/images/logo.png" type="image/png" />
        <link rel="stylesheet" href={BVI_CSS_HREF} />
        <link rel="stylesheet" href={BVI_KRIMVK_CSS_HREF} />
      </head>
      <body className={`${onest.className} font-sans antialiased`}>
        <Providers>
          <BviRouteSync />
          <div className={`${SITE_SHELL_CLASS} flex min-h-screen flex-col`}>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </div>
          <BviPlugin />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
