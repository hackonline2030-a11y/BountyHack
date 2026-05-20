import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { loadMemberTeams } from "@modules/report-team/core/useCase/load-member-teams.usecase";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const leaveReportTeam =
  (teamId: string) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      await deps.reportTeamRepository.leaveTeam(teamId);
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      await dispatch(loadMemberTeams());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
