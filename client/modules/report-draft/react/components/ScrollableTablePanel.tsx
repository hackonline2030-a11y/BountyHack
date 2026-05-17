import { type FC, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Keeps wide tables usable when row count exceeds the viewport. */
export const ScrollableTablePanel: FC<Props> = ({ children, className = "" }) => (
  <div
    className={`max-h-[min(100vh,42rem)] overflow-auto rounded-lg border border-form-border bg-white shadow-sm ${className}`.trim()}
  >
    {children}
  </div>
);
