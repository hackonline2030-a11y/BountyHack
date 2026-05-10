import { describe, expect, it } from "@jest/globals";
import type { IAccessTokenVerifier } from "../gateway/access-token-verifier.gateway";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";
import type { VerifiedAccessPayload } from "../model/auth.domain-model";
import { establishAppSessionUseCase } from "./establish-app-session.usecase";

const futurePayload = (expOffsetSec: number): VerifiedAccessPayload => ({
  sub: "u1",
  email: "a@b.co",
  expSeconds: Math.floor(Date.now() / 1000) + expOffsetSec,
});

class StubVerifier implements IAccessTokenVerifier {
  constructor(private readonly result: VerifiedAccessPayload | null) {}

  async verify(rawToken: string): Promise<VerifiedAccessPayload | null> {
    void rawToken;
    return this.result;
  }
}

class StubSession implements IAppHostSessionGateway {
  public setCalls: { token: string; maxAge: number }[] = [];

  async getRawAccessToken(): Promise<string | null> {
    return null;
  }

  async setHttpOnlyAccessCookie(
    token: string,
    maxAgeSeconds: number,
  ): Promise<void> {
    this.setCalls.push({ token, maxAge: maxAgeSeconds });
  }

  async clearAccessCookie(): Promise<void> {}
}

describe("establishAppSessionUseCase", () => {
  it("sets cookie when lng and token are valid", async () => {
    const verifier = new StubVerifier(futurePayload(3600));
    const session = new StubSession();
    const outcome = await establishAppSessionUseCase(
      { token: "jwt-here", lng: "en" },
      { verifier, session },
    );
    expect(outcome).toEqual({ outcome: "success" });
    expect(session.setCalls).toHaveLength(1);
    expect(session.setCalls[0].token).toBe("jwt-here");
    expect(session.setCalls[0].maxAge).toBeGreaterThan(0);
  });

  it("rejects unsupported lng before verifying token", async () => {
    const verifier = new StubVerifier(futurePayload(3600));
    const session = new StubSession();
    const outcome = await establishAppSessionUseCase(
      { token: "jwt-here", lng: "de" },
      { verifier, session },
    );
    expect(outcome).toEqual({ outcome: "invalid_lng" });
    expect(session.setCalls).toHaveLength(0);
  });

  it("returns token_expired when exp is past", async () => {
    const verifier = new StubVerifier({
      sub: "u1",
      email: "",
      expSeconds: Math.floor(Date.now() / 1000),
    });
    const session = new StubSession();
    const outcome = await establishAppSessionUseCase(
      { token: "jwt", lng: "fr" },
      { verifier, session },
    );
    expect(outcome).toEqual({ outcome: "token_expired" });
  });
});
