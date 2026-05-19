import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { refreshReportTeamsData } from "@modules/report-team/core/useCase/refresh-report-teams-data.usecase";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const deleteReportTeam =
  (input: { teamId: string }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      await deps.reportTeamRepository.deleteTeam(input.teamId);
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      await dispatch(refreshReportTeamsData({ withPendingJoinRequests: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
