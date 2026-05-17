import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

type Options = {
  withPendingJoinRequests?: boolean;
};

/** Reload teams list and orphan drafts (and optionally pending join requests). */
export const refreshReportTeamsData =
  (options: Options = {}) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    const tasks = [
      deps.reportTeamRepository.findAllTeams(),
      deps.reportTeamRepository.findOrphanDrafts(),
    ] as const;
    const withPending = options.withPendingJoinRequests === true;

    if (withPending) {
      const [allTeams, orphanDrafts, pendingJoinRequests] = await Promise.all([
        ...tasks,
        deps.reportTeamRepository.findPendingJoinRequests(),
      ]);
      dispatch(
        reportTeamsSlice.actions.loadSucceeded({
          allTeams,
          orphanDrafts,
          pendingJoinRequests,
        }),
      );
      return;
    }

    const [allTeams, orphanDrafts] = await Promise.all(tasks);
    dispatch(reportTeamsSlice.actions.loadSucceeded({ allTeams, orphanDrafts }));
  };
