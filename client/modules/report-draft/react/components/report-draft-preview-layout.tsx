"use client";

import {
  type CSSProperties,
  type FC,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const CSS_PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = (A4_WIDTH_MM / MM_PER_INCH) * CSS_PX_PER_INCH;
const A4_HEIGHT_PX = (A4_HEIGHT_MM / MM_PER_INCH) * CSS_PX_PER_INCH;

type PreviewPageMetrics = {
  scale: number;
  heightPx: number;
};

const DEFAULT_PAGE_METRICS: PreviewPageMetrics = {
  scale: 1,
  heightPx: A4_HEIGHT_PX,
};

/** Zone scrollable de l’aperçu (max. hauteur viewport). */
export const ReportPreviewScrollArea: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="report-preview-scroll max-h-screen w-full overflow-y-auto bg-slate-100 py-4">
    <div className="report-preview-stack mx-auto flex w-full flex-col items-center">
      {children}
    </div>
  </div>
);

/** Feuille A4 (largeur / hauteur minimale alignées sur le PDF). */
export const ReportPreviewA4Page: FC<{
  children: ReactNode;
  "aria-label"?: string;
}> = ({ children, "aria-label": ariaLabel = "Page du rapport" }) => {
  const pageRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState(DEFAULT_PAGE_METRICS);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const content = contentRef.current;
    if (!page || !content) return;

    let animationFrame = 0;

    const updateMetrics = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const availableWidth = page.clientWidth || A4_WIDTH_PX;
        const nextScale = Math.min(1, availableWidth / A4_WIDTH_PX);
        const nextHeightPx = Math.max(A4_HEIGHT_PX, content.scrollHeight) * nextScale;

        setMetrics((current) => {
          if (
            Math.abs(current.scale - nextScale) < 0.001 &&
            Math.abs(current.heightPx - nextHeightPx) < 0.5
          ) {
            return current;
          }

          return {
            scale: nextScale,
            heightPx: nextHeightPx,
          };
        });
      });
    };

    updateMetrics();

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const pageObserver = new ResizeObserver(updateMetrics);
      const contentObserver = new ResizeObserver(updateMetrics);
      pageObserver.observe(page);
      contentObserver.observe(content);
      observers.push(pageObserver, contentObserver);
    }

    window.addEventListener("resize", updateMetrics);
    return () => {
      cancelAnimationFrame(animationFrame);
      observers.forEach((observer) => observer.disconnect());
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  const pageStyle = {
    "--report-preview-scale": metrics.scale,
    "--report-preview-page-height": `${metrics.heightPx}px`,
  } as CSSProperties;

  return (
    <article
      ref={pageRef}
      aria-label={ariaLabel}
      className="report-preview-page box-border shrink-0 bg-white leading-[1.45] text-[#1f2430] shadow-lg"
      style={pageStyle}
    >
      <div ref={contentRef} className="report-preview-page-content">
        {children}
      </div>
    </article>
  );
};

/** Séparateur visuel entre deux pages (changement de page). */
export const ReportPreviewPageBreak: FC = () => (
  <div
    role="separator"
    aria-label="Changement de page"
    className="report-preview-page-break my-3 box-border shrink-0 border-t-2 border-dashed border-slate-400"
  />
);
