import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

type Options = {
  withPendingJoinRequests?: boolean;
  withPendingLeaveRequests?: boolean;
};

/** Reload teams list and orphan drafts (and optionally pending join/leave requests). */
export const refreshReportTeamsData =
  (options: Options = {}) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    const withPendingJoin = options.withPendingJoinRequests === true;
    const withPendingLeave = options.withPendingLeaveRequests === true;

    const [allTeams, orphanDrafts, pendingJoinRequests, pendingLeaveRequests] =
      await Promise.all([
        deps.reportTeamRepository.findAllTeams(),
        deps.reportTeamRepository.findOrphanDrafts(),
        withPendingJoin
          ? deps.reportTeamRepository.findPendingJoinRequests()
          : Promise.resolve(undefined),
        withPendingLeave
          ? deps.reportTeamRepository.findPendingLeaveRequests()
          : Promise.resolve(undefined),
      ]);

    dispatch(
      reportTeamsSlice.actions.loadSucceeded({
        allTeams,
        orphanDrafts,
        ...(pendingJoinRequests !== undefined ? { pendingJoinRequests } : {}),
        ...(pendingLeaveRequests !== undefined ? { pendingLeaveRequests } : {}),
      }),
    );
  };
