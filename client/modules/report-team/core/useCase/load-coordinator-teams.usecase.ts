import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const loadCoordinatorTeams =
  () =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.loadStarted());
    try {
      const [allTeams, pendingJoinRequests] = await Promise.all([
        deps.reportTeamRepository.findAllTeams(),
        deps.reportTeamRepository.findPendingJoinRequests(),
      ]);
      dispatch(
        reportTeamsSlice.actions.loadSucceeded({ allTeams, pendingJoinRequests }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.loadFailed({ message }));
    }
  };
