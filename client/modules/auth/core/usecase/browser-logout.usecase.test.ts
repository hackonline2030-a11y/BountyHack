import { describe, expect, it } from "@jest/globals";
import { performBrowserLogoutUseCase } from "./browser-logout.usecase";

describe("performBrowserLogoutUseCase", () => {
  it("runs remote revoke then clears Next session cookie", async () => {
    const sequence: string[] = [];
    await performBrowserLogoutUseCase({
      revokeOpaqueRefreshOnNest: async () => {
        sequence.push("revoke");
      },
      clearAppSessionCookieOnNextOrigin: async () => {
        sequence.push("clear");
      },
    });
    expect(sequence).toEqual(["revoke", "clear"]);
  });

  it("still clears Next cookie when revoke throws", async () => {
    let cleared = false;
    await performBrowserLogoutUseCase({
      revokeOpaqueRefreshOnNest: async () => {
        throw new Error("network");
      },
      clearAppSessionCookieOnNextOrigin: async () => {
        cleared = true;
      },
    });
    expect(cleared).toBe(true);
  });
});
