import type { Metadata } from "next";
import { assistantEnabled, seasonalEnabled, noticesEnabled } from '@/lib/release-features';
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { BviPlugin } from "@/components/BviPlugin";
import { BviRouteSync } from "@/components/BviRouteSync";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { onest } from "@/lib/fonts";
import { SITE_SHELL_CLASS } from "@/lib/bvi-constants";
import { SeasonalPreview } from "@/components/seasonal/SeasonalPreview";
import { DevTariffNotice } from "@/components/layout/DevTariffNotice";
import { PageLoadingProvider } from "@/components/PageLoadingProvider";

export const metadata: Metadata = {
  title: "КрымВК - Водоканал Крыма",
  description: "Официальный сайт водоканала Крыма. Подача показаний счетчиков, оплата счетов, заявки на услуги.",
  icons: {
    icon: [
      { url: "/images/brand/company-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/brand/company-icon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/images/brand/company-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/images/brand/company-icon-32.png",
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
        <link rel="icon" href="/images/brand/company-icon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/brand/company-icon-16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/brand/company-icon-180.png" sizes="180x180" />
        <link rel="shortcut icon" href="/images/brand/company-icon-32.png" type="image/png" />
      </head>
      <body className={`${onest.className} font-sans antialiased`}>
        <Providers>
          <PageLoadingProvider>
          <BviRouteSync />
          <div className={`${SITE_SHELL_CLASS} flex min-h-screen flex-col`}>
            <Header />
            {noticesEnabled() && <DevTariffNotice />}
            <main className="flex flex-1 flex-col">{children}</main>
            {(assistantEnabled() || seasonalEnabled()) && <SeasonalPreview />}
            <Footer />
          </div>
          <BviPlugin />
          <CookieConsentBanner />
          </PageLoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
