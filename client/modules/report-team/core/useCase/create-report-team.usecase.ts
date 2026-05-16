import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { loadCoordinatorTeams } from "@modules/report-team/core/useCase/load-coordinator-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const createReportTeam =
  (input: {
    label: string;
    members: Array<{ userId: string; role: ReportTeamMemberRole }>;
  }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      await deps.reportTeamRepository.createTeam(input);
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      await dispatch(loadCoordinatorTeams());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
