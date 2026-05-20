import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const loadCoordinatorTeamDetail =
  (teamId: string) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.teamDetailLoadStarted());
    try {
      const team = await deps.reportTeamRepository.findById(teamId);
      if (team === null) {
        dispatch(
          reportTeamsSlice.actions.teamDetailLoadFailed({
            message: "TEAM_NOT_FOUND",
          }),
        );
        return;
      }
      dispatch(reportTeamsSlice.actions.teamDetailLoadSucceeded(team));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.teamDetailLoadFailed({ message }));
    }
  };
