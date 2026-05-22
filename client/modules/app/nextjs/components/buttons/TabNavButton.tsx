"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import {
  tabButtonActiveClass,
  tabButtonBaseClass,
  tabButtonInactiveClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  children: ReactNode;
};

export const TabNavButton: FC<Props> = ({
  active,
  className = "",
  children,
  type = "button",
  role = "tab",
  ...rest
}) => (
  <button
    type={type}
    role={role}
    className={`${tabButtonBaseClass} ${
      active ? tabButtonActiveClass : tabButtonInactiveClass
    } ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);
