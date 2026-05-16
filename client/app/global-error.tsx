"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Catches errors in the **root** `layout.tsx` / `template` where the ordinary
 * `error.tsx` boundaries cannot wrap the layout above them.
 * Must render full `<html>` and `<body>` (root layout is not used while this UI is shown).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="overflow-x-hidden antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center bg-pattern px-4 py-12">
          <div className="dashboard-card mx-auto w-full max-w-lg px-6 py-10 text-center sm:px-8 sm:py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-muted">
              Critical error
            </p>
            <h1 className="mt-2 text-2xl font-bold text-dashboard-text sm:text-3xl">
              Something went wrong
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-dashboard-text-muted">
              The application shell could not be loaded. Try again after a refresh, or contact
              support if the problem continues.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-dashboard-text-subtle">Ref: {error.digest}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {reset ? (
                <button type="button" onClick={() => reset()} className="btn-common-styles btn-primary">
                  Try again
                </button>
              ) : null}
              <button
                type="button"
                className="btn-common-styles inline-flex items-center justify-center border border-dashboard-card-border bg-white px-5 py-2.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-accent-soft/60"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Go to site root
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
