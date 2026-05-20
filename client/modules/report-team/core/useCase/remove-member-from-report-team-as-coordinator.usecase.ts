import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { refreshReportTeamsData } from "@modules/report-team/core/useCase/refresh-report-teams-data.usecase";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const removeMemberFromReportTeamAsCoordinator =
  (input: { teamId: string; memberUserId: string }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      const team = await deps.reportTeamRepository.removeTeamMember(
        input.teamId,
        input.memberUserId,
      );
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      dispatch(reportTeamsSlice.actions.teamDetailLoadSucceeded(team));
      await dispatch(refreshReportTeamsData({ withPendingJoinRequests: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
