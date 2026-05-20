import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export type CoordinatorHunterUserOption = {
  userId: string;
  displayName: string;
};

export const loadCoordinatorHunterUsers =
  () =>
  async (
    _dispatch: AppDispatch,
    _getState: unknown,
    deps: Dependencies,
  ): Promise<CoordinatorHunterUserOption[]> => {
    return deps.reportTeamRepository.findCoordinatorHunterUsers();
  };
