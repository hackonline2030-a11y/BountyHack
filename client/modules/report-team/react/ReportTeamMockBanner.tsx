import type { FC } from "react";

type Props = { message: string };

export const ReportTeamMockBanner: FC<Props> = ({ message }) => (
  <p
    role="status"
    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
  >
    {message}
  </p>
);
