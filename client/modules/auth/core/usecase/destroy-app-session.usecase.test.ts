import { describe, expect, it } from "@jest/globals";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";
import { destroyAppSessionUseCase } from "./destroy-app-session.usecase";

class StubSession implements IAppHostSessionGateway {
  clearCalls = 0;

  async getRawAccessToken(): Promise<string | null> {
    return null;
  }

  async setHttpOnlyAccessCookie(): Promise<void> {}

  async clearAccessCookie(): Promise<void> {
    this.clearCalls += 1;
  }
}

describe("destroyAppSessionUseCase", () => {
  it("delegates to session gateway", async () => {
    const session = new StubSession();
    await destroyAppSessionUseCase({ session });
    expect(session.clearCalls).toBe(1);
  });
});
