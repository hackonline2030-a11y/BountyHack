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
        ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800"
        : "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900"
    }
  >
    {validity === "valid" ? validLabel : incompleteLabel}
  </span>
);
