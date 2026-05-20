import type { ComponentProps, FC, ReactNode } from "react";
import Link from "next/link";

type Props = ComponentProps<typeof Link> & {
  children: ReactNode;
};

/** Primary tile CTA link — same look as `ActionButton` / TOTP « Démarrer la configuration ». */
export const ActionLink: FC<Props> = ({ className = "", children, ...rest }) => (
  <Link
    className={`action-btn action-btn--primary inline-flex w-fit cursor-pointer items-center no-underline ${className}`.trim()}
    {...rest}
  >
    {children}
  </Link>
);
