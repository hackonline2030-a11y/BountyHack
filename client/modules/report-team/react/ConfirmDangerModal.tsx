"use client";

import type { FC, ReactNode } from "react";

type ConfirmDangerModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDangerModal: FC<ConfirmDangerModalProps> = ({
  open,
  title,
  children,
  cancelLabel,
  confirmLabel,
  confirming = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label={cancelLabel}
        disabled={confirming}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-danger-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-dashboard-card-border bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-danger-title" className="text-lg font-semibold text-dashboard-text">
          {title}
        </h2>
        <div className="mt-3 text-sm text-dashboard-text-muted">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-dashboard-divider px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-slate-50 disabled:opacity-50"
            disabled={confirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
