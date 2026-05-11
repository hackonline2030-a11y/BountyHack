"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@/modules/app/nextjs/hooks/useElementHeightCssVar";
import { localePrefixFromPathname } from "@/lib/locale-path";

export const Footer = () => {
  const { t } = useT("common");
  const pathname = usePathname();
  const { ref } = useElementHeightCssVar({
    cssVarName: "--footer-height",
    initialPx: 0,
    writeTo: "root",
  });
  const prefix = localePrefixFromPathname(pathname);
  const isFr = prefix === "/fr";
  const privacyHref = `${prefix}/${isFr ? "politique-de-confidentialite" : "privacy-policy"}`;
  const noticeHref = `${prefix}/${isFr ? "mentions-legales" : "legal-notice"}`;
  const creditsHref = `${prefix}/credits`;

  return (
    <footer ref={ref} className="w-full border-t border-black/10 bg-white">
      <div className="footer-container flex flex-col items-start justify-between gap-3 py-4 text-sm text-black/60 sm:flex-row sm:items-center">
        <p>{t("footer.copyright")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={privacyHref}
            className="transition hover:underline focus:underline focus:outline-none"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            href={noticeHref}
            className="transition hover:underline focus:underline focus:outline-none"
          >
            {t("footer.notice")}
          </Link>
          <Link
            href={creditsHref}
            className="transition hover:underline focus:underline focus:outline-none"
          >
            {t("footer.credits")}
          </Link>
        </div>
      </div>
    </footer>
  );
};