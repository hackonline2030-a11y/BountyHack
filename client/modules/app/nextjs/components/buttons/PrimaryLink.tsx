import type { ComponentProps, FC, ReactNode } from "react";
import Link from "next/link";
import { primaryButtonClass } from "@modules/app/nextjs/components/buttons/button-styles";

type Props = ComponentProps<typeof Link> & {
  children: ReactNode;
};

export const PrimaryLink: FC<Props> = ({ className = "", children, ...rest }) => (
  <Link className={`${primaryButtonClass} ${className}`.trim()} {...rest}>
    {children}
  </Link>
);
