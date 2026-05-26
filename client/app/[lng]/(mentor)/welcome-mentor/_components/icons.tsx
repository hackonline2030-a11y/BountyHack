import type { FC, ReactNode, SVGProps } from "react";

/**
 * Tiny inline icon set used by the dashboard sidebar. Kept in this folder so
 * the dashboard doesn't pull a 3rd-party icon library; each glyph is a 24x24
 * stroked SVG that inherits `currentColor`, so the nav can recolor it via the
 * `--dashboard-*` palette without prop drilling.
 */

type IconProps = SVGProps<SVGSVGElement>;

const IconBase: FC<IconProps & { children: ReactNode }> = ({
  children,
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const EmailIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </IconBase>
);

/** Document with a check mark — used for the quality-checker report queue. */
export const ReportIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6" />
    <path d="m9 14 2 2 4-4" />
  </IconBase>
);

/** Two adjacent silhouettes — used for "My colleagues" (mentors, peers). */
export const ColleagueIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 17a4.5 4.5 0 0 1 6 4" />
  </IconBase>
);

export const SupportIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
    <path d="M12 17.5h.01" />
  </IconBase>
);

export const TeamIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 17a4.5 4.5 0 0 1 6 4" />
  </IconBase>
);

export const CriteriaIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </IconBase>
);

export const SettingsIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.07.07a2 2 0 1 1-2.83 2.83l-.07-.07a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.07.07a2 2 0 1 1-2.83-2.83l.07-.07A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.94 1.7 1.7 0 0 0 4.26 7.07l-.07-.07a2 2 0 1 1 2.83-2.83l.07.07a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.07-.07a2 2 0 1 1 2.83 2.83l-.07.07a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.03Z" />
  </IconBase>
);
