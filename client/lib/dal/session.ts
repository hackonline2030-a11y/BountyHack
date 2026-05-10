import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { requireAppSessionUseCase } from "@modules/auth/core/usecase/require-app-session.usecase";

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

/**
 * Ensures an active access JWT cookie exists on the Next host (DAL pattern).
 * @see https://nextjs.org/docs/app/guides/authentication#create-a-data-access-layer-dal-with-only-the-data-you-need
 */
export const verifySession = cache(async (lng: string) => {
  const result = await requireAppSessionUseCase(
    createRequireAppSessionDependencies(),
  );

  if (!result.ok) {
    redirect(loginHref(lng));
  }

  return result.payload;
});
