import type { FC, ReactNode } from "react";

type Props = {
  /**
   * HTML id of the heading. Required so the surrounding <section> can use
   * `aria-labelledby` and become a properly-named landmark.
   */
  titleId: string;
  title: string;
  subtitle?: string;
  /** Optional element shown on the right of the header (badge, count, …). */
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * White tile floating on the violet bg-pattern. Children fill the rest of the
 * card with `flex-1`, so a CTA marked with `mt-auto` will align to the bottom
 * — keeping every card in a row a consistent height.
 */
export const DashboardCard: FC<Props> = ({
  titleId,
  title,
  subtitle,
  headerExtra,
  children,
  className = "",
}) => (
  <section
    aria-labelledby={titleId}
    className={`dashboard-card flex flex-col p-4 sm:p-5 ${className}`.trim()}
  >
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2
          id={titleId}
          className="text-base font-semibold text-dashboard-text"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-dashboard-text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {headerExtra}
    </header>
    <div className="mt-4 flex flex-1 flex-col">{children}</div>
  </section>
);
