"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import {
  dashboardCompactAccentClass,
  dashboardCompactNeutralClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

export type DashboardCompactButtonVariant = "accent" | "neutral";

const VARIANT_CLASS: Record<DashboardCompactButtonVariant, string> = {
  accent: dashboardCompactAccentClass,
  neutral: dashboardCompactNeutralClass,
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: DashboardCompactButtonVariant;
  children: ReactNode;
};

export const DashboardCompactButton: FC<Props> = ({
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
