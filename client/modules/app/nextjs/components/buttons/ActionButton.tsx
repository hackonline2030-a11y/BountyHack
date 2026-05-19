"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";

export type ActionButtonVariant = "primary" | "secondary" | "danger" | "neutral";

const VARIANT_CLASS: Record<ActionButtonVariant, string> = {
  primary: "action-btn--primary",
  secondary: "action-btn--secondary",
  danger: "action-btn--danger",
  neutral: "action-btn--neutral",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
  children: ReactNode;
};

/** Compact form/panel button — uses `.action-btn` variants from globals.css. */
export const ActionButton: FC<Props> = ({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    className={`action-btn cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);
