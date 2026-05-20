"use client";

import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import {
  submissionApproveClass,
  submissionRejectClass,
  submissionRevisionClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

export type SubmissionDecisionVariant = "approve" | "revision" | "reject";

const VARIANT_CLASS: Record<SubmissionDecisionVariant, string> = {
  approve: submissionApproveClass,
  revision: submissionRevisionClass,
  reject: submissionRejectClass,
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: SubmissionDecisionVariant;
  children: ReactNode;
};

export const SubmissionDecisionButton: FC<Props> = ({
  variant,
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
