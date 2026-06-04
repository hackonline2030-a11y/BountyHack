"use client";

import Link from "next/link";
import { useState, type FC } from "react";

export type FakeUserSetupLinkModalProps = {
  open: boolean;
  title: string;
  lead: string;
  username: string;
  email: string;
  setupLink: string;
  openLinkLabel: string;
  copyLinkLabel: string;
  copiedLabel: string;
  closeLabel: string;
  onClose: () => void;
};

export const FakeUserSetupLinkModal: FC<FakeUserSetupLinkModalProps> = ({
  open,
  title,
  lead,
  username,
  email,
  setupLink,
  openLinkLabel,
  copyLinkLabel,
  copiedLabel,
  closeLabel,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(setupLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: user can select from the anchor */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-slate-900/50"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fake-user-setup-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-dashboard-card-border bg-white p-6 shadow-xl"
      >
        <h2 id="fake-user-setup-title" className="text-lg font-semibold text-dashboard-text">
          {title}
        </h2>
        <p className="mt-2 text-sm text-dashboard-text-muted">{lead}</p>
        <p className="mt-3 text-sm text-dashboard-text">
          <span className="font-medium">{username}</span>
          <span className="text-dashboard-text-muted"> — {email}</span>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={setupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-violet-600 bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            {openLinkLabel}
          </Link>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-dashboard-divider px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-slate-50"
            onClick={() => {
              void copyLink();
            }}
          >
            {copied ? copiedLabel : copyLinkLabel}
          </button>
        </div>
        <p className="mt-3 break-all text-xs text-slate-500">
          <a href={setupLink} className="underline underline-offset-2 hover:text-violet-700">
            {setupLink}
          </a>
        </p>
        <p className="sr-only" aria-live="polite">
          {copied ? copiedLabel : ""}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-dashboard-divider px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-slate-50"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
