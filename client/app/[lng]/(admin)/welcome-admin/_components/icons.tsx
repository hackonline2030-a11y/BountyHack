import type { FC, ReactNode, SVGProps } from "react";

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

export const UsersIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 17a4.5 4.5 0 0 1 6 4" />
  </IconBase>
);

export const UserPlusIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </IconBase>
);

export const CriteriaIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </IconBase>
);

export const TeamIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
);

export const SettingsIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.07.07a2 2 0 1 1-2.83 2.83l-.07-.07a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.07.07a2 2 0 1 1-2.83-2.83l.07-.07A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.94 1.7 1.7 0 0 0 4.26 7.07l-.07-.07a2 2 0 1 1 2.83-2.83l.07.07a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.07-.07a2 2 0 1 1 2.83 2.83l-.07.07a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.03Z" />
  </IconBase>
);
