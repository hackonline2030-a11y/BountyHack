import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { refreshReportTeamsData } from "@modules/report-team/core/useCase/refresh-report-teams-data.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const createReportTeam =
  (input: {
    label: string;
    members: Array<{ userId: string; role: ReportTeamMemberRole }>;
    reportDraftId?: string;
    hunterWriterUserId?: string;
  }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      await deps.reportTeamRepository.createTeam(input);
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      await dispatch(refreshReportTeamsData({ withPendingJoinRequests: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
