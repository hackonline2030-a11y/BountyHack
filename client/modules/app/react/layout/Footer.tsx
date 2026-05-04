"use client";

import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@modules/app/react/hooks/useElementHeightCssVar";

export const Footer = () => {
  const { t } = useT("common");
  const { ref } = useElementHeightCssVar({
    cssVarName: "--footer-height",
    initialPx: 0,
    writeTo: "root",
  });
  const year = new Date().getFullYear();

  return (
    <footer ref={ref} className="w-full border-t border-black/10 bg-white">
      <div className="footer-container flex items-center justify-between gap-3 text-sm text-black/60">
        <p>{t("footer.copyright", { year })}</p>
        <p>{t("footer.credit")}</p>
      </div>
    </footer>
  );
};