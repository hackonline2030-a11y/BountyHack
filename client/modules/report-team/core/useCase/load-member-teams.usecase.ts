import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const loadMemberTeams =
  () =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.loadStarted());
    try {
      const [myTeams, joinableTeams, myJoinRequests] = await Promise.all([
        deps.reportTeamRepository.findMyTeams(),
        deps.reportTeamRepository.findJoinableTeams(),
        deps.reportTeamRepository.findMyJoinRequests(),
      ]);
      dispatch(
        reportTeamsSlice.actions.loadSucceeded({
          myTeams,
          joinableTeams,
          myJoinRequests,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.loadFailed({ message }));
    }
  };
