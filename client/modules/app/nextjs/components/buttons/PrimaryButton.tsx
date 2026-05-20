"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import {
  primaryButtonClass,
  primaryDarkButtonClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

export type PrimaryButtonVariant = "violet" | "dark";

const VARIANT_CLASS: Record<PrimaryButtonVariant, string> = {
  violet: primaryButtonClass,
  dark: primaryDarkButtonClass,
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PrimaryButtonVariant;
  children: ReactNode;
};

export const PrimaryButton: FC<Props> = ({
  variant = "violet",
  className = "",
  children,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);
