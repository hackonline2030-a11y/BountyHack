"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import {
  formPanelAccentClass,
  formPanelEmeraldClass,
  formPanelSurfaceClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

export type FormPanelButtonVariant = "accent" | "surface" | "emerald";

const VARIANT_CLASS: Record<FormPanelButtonVariant, string> = {
  accent: formPanelAccentClass,
  surface: formPanelSurfaceClass,
  emerald: formPanelEmeraldClass,
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: FormPanelButtonVariant;
  children: ReactNode;
};

export const FormPanelButton: FC<Props> = ({
  variant = "accent",
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
