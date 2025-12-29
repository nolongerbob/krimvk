import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { BVIPanel } from "@/components/BVIPanel";

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
    <html lang="ru">
      <head>
        <link href="/bvi/css/bvi.min.css" rel="stylesheet" />
        <link rel="icon" href="/images/logo.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/logo.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/logo.png" sizes="180x180" />
        <link rel="shortcut icon" href="/images/logo.png" type="image/png" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <BVIPanel />
        </Providers>
      </body>
    </html>
  );
}
