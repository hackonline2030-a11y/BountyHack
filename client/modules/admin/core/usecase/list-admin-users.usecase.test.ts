import { describe, expect, it } from "@jest/globals";
import { AppRoleCode } from "@/lib/app-role-code";
import type { IAdminUsersGateway } from "../gateway/admin-users.gateway";
import { listAdminUsersUseCase } from "./list-admin-users.usecase";

/**
 * Mirrors `stubResponse` from `password-reset.usecase.test.ts`: a small
 * duck-typed `Response` so we don't depend on the global `Response`
 * constructor (flaky under jsdom).
 */
function stubResponse(
  status: number,
  body: () => Promise<unknown> = async () => null,
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: body,
  } as unknown as Response;
}

class StubGateway implements IAdminUsersGateway {
  public lastToken: string | null = null;

  constructor(private readonly responseFactory: () => Response | Promise<Response>) {}

  async list(bearerToken: string): Promise<Response> {
    this.lastToken = bearerToken;
    return this.responseFactory();
  }
}

describe("listAdminUsersUseCase", () => {
  it("parses items and forwards the bearer token", async () => {
    const gateway = new StubGateway(() =>
      stubResponse(200, async () => ({
        items: [
          {
            uid: "u-1",
            username: "alice",
            email: "alice@example.com",
            roleCode: "SUPER_ADMIN",
          },
          {
            uid: "u-2",
            username: "bob",
            email: null,
            roleCode: "HUNTER",
          },
        ],
      })),
    );

    const result = await listAdminUsersUseCase(
      { token: "raw-jwt" },
      { gateway },
    );

    expect(gateway.lastToken).toBe("raw-jwt");
    expect(result).toEqual({
      ok: true,
      items: [
        {
          uid: "u-1",
          username: "alice",
          email: "alice@example.com",
          roleCode: AppRoleCode.SUPER_ADMIN,
        },
        {
          uid: "u-2",
          username: "bob",
          email: null,
          roleCode: AppRoleCode.HUNTER,
        },
      ],
    });
  });

  it("coerces unknown role codes to null", async () => {
    const gateway = new StubGateway(() =>
      stubResponse(200, async () => ({
        items: [{ uid: "u-x", username: "evil", email: null, roleCode: "BACKDOOR_ADMIN" }],
      })),
    );

    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });

    expect(result).toEqual({
      ok: true,
      items: [{ uid: "u-x", username: "evil", email: null, roleCode: null }],
    });
  });

  it("drops rows missing the required identifiers", async () => {
    const gateway = new StubGateway(() =>
      stubResponse(200, async () => ({
        items: [
          { username: "no-uid" },
          { uid: "no-name" },
          { uid: "ok", username: "ok", email: "ok@example.com", roleCode: "HUNTER" },
        ],
      })),
    );

    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toEqual([
        { uid: "ok", username: "ok", email: "ok@example.com", roleCode: AppRoleCode.HUNTER },
      ]);
    }
  });

  it("returns unauthorized on 401 (caller decides to redirect)", async () => {
    const gateway = new StubGateway(() => stubResponse(401));
    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });
    expect(result).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("returns unreachable on non-2xx (and not 401)", async () => {
    const gateway = new StubGateway(() => stubResponse(503));
    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("returns unreachable when the gateway throws (network failure)", async () => {
    const gateway = new StubGateway(() => {
      throw new Error("ECONNREFUSED");
    });
    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("returns malformed_payload when JSON parsing throws", async () => {
    const gateway = new StubGateway(() =>
      stubResponse(200, async () => {
        throw new SyntaxError("Unexpected token in JSON");
      }),
    );
    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });
    expect(result).toEqual({ ok: false, reason: "malformed_payload" });
  });

  it("returns malformed_payload when items is missing or not an array", async () => {
    const gateway = new StubGateway(() =>
      stubResponse(200, async () => ({ total: 0 })),
    );
    const result = await listAdminUsersUseCase({ token: "t" }, { gateway });
    expect(result).toEqual({ ok: false, reason: "malformed_payload" });
  });
});
