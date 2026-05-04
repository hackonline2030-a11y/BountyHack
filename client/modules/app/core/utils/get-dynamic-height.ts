type ObserveDynamicHeightOptions = {
  element: HTMLElement;
  onHeightChange: (height: number) => void;
  roundPx?: boolean;
};

function readElementHeight(element: HTMLElement): number {
  const rectHeight = element.getBoundingClientRect().height;
  const offsetHeight = element.offsetHeight;
  const scrollHeight = element.scrollHeight;

  return Math.max(rectHeight, offsetHeight, scrollHeight);
}

/**
 * Observe an element height and notify on changes.
 * Uses ResizeObserver when available and falls back to window resize.
 */
export function observeDynamicHeight({
  element,
  onHeightChange,
  roundPx = true,
}: ObserveDynamicHeightOptions): () => void {
  let rafId: number | null = null;
  let lastHeight: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const notifyIfChanged = () => {
    const nextHeight = readElementHeight(element);
    const value = roundPx ? Math.round(nextHeight) : nextHeight;

    if (lastHeight === value) return;

    lastHeight = value;
    onHeightChange(value);
  };

  const scheduleMeasurement = () => {
    if (rafId != null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      notifyIfChanged();
    });
  };

  // Run one immediate measurement so the consumer gets a real value quickly.
  notifyIfChanged();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      scheduleMeasurement();
    });
    resizeObserver.observe(element);
  }

  // Fallback and extra safety for viewport-driven layout changes.
  window.addEventListener("resize", scheduleMeasurement);

  return () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    window.removeEventListener("resize", scheduleMeasurement);
    if (rafId != null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
