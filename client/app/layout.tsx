import type { Metadata, Viewport } from "next";
import type { Resource } from "i18next";
import { Rubik } from "next/font/google";
import { headers } from "next/headers";
import { I18nProvider } from "next-i18next/client";
import { getT, initServerI18next } from "next-i18next/server";
import i18nConfig from "@/i18n.config";
import enCommon from "@/app/i18n/locales/en/common.json";
import enConnexion from "@/app/i18n/locales/en/connexion.json";
import frCommon from "@/app/i18n/locales/fr/common.json";
import frConnexion from "@/app/i18n/locales/fr/connexion.json";
import "@/app/globals.css";
import { ThemeProvider } from "@modules/app/react/ThemeProvider";
import { Header } from "@modules/app/react/layout/Header";
import { Footer } from "@modules/app/react/layout/Footer";

initServerI18next(i18nConfig);

/** Bundled for client `I18nProvider` so every namespace (e.g. `connexion`) hydrates reliably. */
const clientI18nResources = {
  en: { common: enCommon, connexion: enConnexion },
  fr: { common: frCommon, connexion: frConnexion },
} satisfies Resource;

const LANG_HEADER = "x-i18next-current-language";

const siteName = "Clean App — Next.js template";
const siteDescription =
  "Auth-first Next.js starter: TypeScript, Prisma, modular architecture, and tests — ready to extend.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

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
  applicationName: "Clean App",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
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
  await getT(["common", "connexion"], { lng: lang });

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
            <Header />
            {children}
            <Footer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
