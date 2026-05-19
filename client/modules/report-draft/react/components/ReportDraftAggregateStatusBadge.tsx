import type { FC } from "react";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftAggregateStatusBadgeClass } from "@modules/report-draft/core/view/report-draft-aggregate-status-styles";

type Props = {
  status: ReportDraftDomainModel.AggregateStatus;
  label: string;
};

export const ReportDraftAggregateStatusBadge: FC<Props> = ({ status, label }) => (
  <span
    className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-2.5 py-1 text-center text-[10px] font-semibold uppercase leading-none tracking-wide ${reportDraftAggregateStatusBadgeClass(status)}`}
  >
    {label}
  </span>
);
