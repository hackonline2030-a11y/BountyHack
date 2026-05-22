"use client";

import type { ButtonHTMLAttributes, FC } from "react";
import {
  iconActionClass,
  iconActionDangerClass,
  iconActionDraftDangerClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

export type IconActionButtonVariant = "default" | "danger" | "draftDanger";

const VARIANT_CLASS: Record<IconActionButtonVariant, string> = {
  default: iconActionClass,
  danger: iconActionDangerClass,
  draftDanger: iconActionDraftDangerClass,
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconActionButtonVariant;
};

export const IconActionButton: FC<Props> = ({
  variant = "default",
  className = "",
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    {...rest}
  />
);
