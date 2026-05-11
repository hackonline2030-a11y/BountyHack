import { describe, expect, it } from "@jest/globals";
import type { IAccessTokenVerifier } from "../gateway/access-token-verifier.gateway";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";
import type { VerifiedAccessPayload } from "../model/auth.domain-model";
import { sessionBearerForUpstreamUseCase } from "./session-bearer-for-upstream.usecase";

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

describe("sessionBearerForUpstreamUseCase", () => {
  it("returns token when session verifies and raw cookie is available", async () => {
    class SessionWithToken implements IAppHostSessionGateway {
      async getRawAccessToken(): Promise<string | null> {
        return "access-jwt";
      }
      async setHttpOnlyAccessCookie(): Promise<void> {}
      async clearAccessCookie(): Promise<void> {}
    }
    const out = await sessionBearerForUpstreamUseCase({
      verifier: new StubVerifier(futurePayload(3600)),
      session: new SessionWithToken(),
    });
    expect(out).toEqual({ ok: true, token: "access-jwt" });
  });

  it("maps missing cookie from require session", async () => {
    class EmptySession implements IAppHostSessionGateway {
      async getRawAccessToken(): Promise<string | null> {
        return null;
      }
      async setHttpOnlyAccessCookie(): Promise<void> {}
      async clearAccessCookie(): Promise<void> {}
    }
    const out = await sessionBearerForUpstreamUseCase({
      verifier: new StubVerifier(futurePayload(3600)),
      session: new EmptySession(),
    });
    expect(out).toEqual({ ok: false, kind: "missing_cookie" });
  });

  it("returns missing_raw if verify passed but second read lost token", async () => {
    let calls = 0;
    class FlakySession implements IAppHostSessionGateway {
      async getRawAccessToken(): Promise<string | null> {
        calls++;
        return calls === 1 ? "ok" : null;
      }
      async setHttpOnlyAccessCookie(): Promise<void> {}
      async clearAccessCookie(): Promise<void> {}
    }
    const out = await sessionBearerForUpstreamUseCase({
      verifier: new StubVerifier(futurePayload(3600)),
      session: new FlakySession(),
    });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.kind).toBe("missing_raw");
    }
  });
});
