import type { FC } from "react";
import type { ReportTeamValidity } from "@modules/report-team/model/report-team.types";

type Props = {
  validity: ReportTeamValidity;
  validLabel: string;
  incompleteLabel: string;
};

export const ReportTeamValidityBadge: FC<Props> = ({
  validity,
  validLabel,
  incompleteLabel,
}) => (
  <span
    className={
      validity === "valid"
        ? "inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-2.5 py-1 text-center text-[10px] font-semibold uppercase leading-none tracking-wide text-emerald-800 bg-emerald-100"
        : "inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-2.5 py-1 text-center text-[10px] font-semibold uppercase leading-none tracking-wide text-amber-900 bg-amber-100"
    }
  >
    {validity === "valid" ? validLabel : incompleteLabel}
  </span>
);
