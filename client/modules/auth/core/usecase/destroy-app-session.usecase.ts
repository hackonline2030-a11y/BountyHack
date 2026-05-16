import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";

export type DestroyAppSessionDependencies = {
  session: IAppHostSessionGateway;
};

/** Clears the short-lived access JWT httpOnly cookie on the Next app host (after Nest revokes refresh). */
export async function destroyAppSessionUseCase(
  deps: DestroyAppSessionDependencies,
): Promise<void> {
  await deps.session.clearAccessCookie();
}
