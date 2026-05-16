import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { headers } from "next/headers";
import { I18nProvider } from "next-i18next/client";
import { getT, initServerI18next } from "next-i18next/server";
import i18nConfig from "@/i18n.config";
import {
  clientI18nNamespaces,
  clientI18nResources,
} from "@/lib/client-i18n-resources";
import "@/app/globals.css";
import { ThemeProvider } from "@/modules/app/nextjs/ThemeProvider";
import { AppWrapper } from "@/modules/app/nextjs/appWrapper";
import { Header } from "@/modules/app/nextjs/layout/Header";
import { Footer } from "@/modules/app/nextjs/layout/Footer";

initServerI18next(i18nConfig);

const LANG_HEADER = "x-i18next-current-language";

const siteName = "BugBountyApp";
const siteDescription =
  "Bug bounty platform for web applications. Prepare and submit vulnerability reports with educational support for programs like YesWeHack and HackerOne.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-rubik",
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: "BugBountyApp",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    locale: "en_US",
    url: "/",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang =
    (await headers()).get(LANG_HEADER) ?? i18nConfig.fallbackLng ?? "en";
  await getT([...clientI18nNamespaces], { lng: lang });

  return (
    <html
      lang={lang}
      className={`${rubik.variable} overflow-x-hidden antialiased`}
      suppressHydrationWarning
    >
      <body className={rubik.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
        >
          <I18nProvider
            language={lang}
            resources={clientI18nResources}
            supportedLngs={i18nConfig.supportedLngs}
            fallbackLng={i18nConfig.fallbackLng}
          >
            <AppWrapper>
              <Header />
              {children}
              <Footer />
            </AppWrapper>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
