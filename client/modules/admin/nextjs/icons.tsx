import type { FC, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const IconBase: FC<IconProps & { children: React.ReactNode }> = ({
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

/**
 * Resend activation / invitation email.
 * Based on Lucide “mail” — https://lucide.dev/icons/mail (ISC). Credits: /{lng}/credits.
 */
export const MailIcon: FC<IconProps> = (p) => (
  <IconBase {...p}>
    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </IconBase>
);
