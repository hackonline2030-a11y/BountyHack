import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const loadAdminTeams =
  () =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.loadStarted());
    try {
      const allTeams = await deps.reportTeamRepository.findAllTeams();
      dispatch(reportTeamsSlice.actions.loadSucceeded({ allTeams }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.loadFailed({ message }));
    }
  };
