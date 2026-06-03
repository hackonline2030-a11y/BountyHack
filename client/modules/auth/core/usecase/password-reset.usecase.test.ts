import { describe, expect, it } from "@jest/globals";
import type { IPasswordResetGateway } from "../gateway/password-reset.gateway";
import { completePasswordResetUseCase } from "./password-reset.usecase";

function stubResponse(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

describe("password-reset use cases", () => {
  it("delegates complete to gateway", async () => {
    const gateway: IPasswordResetGateway = {
      completeReset: jest.fn().mockResolvedValue(stubResponse(200)),
    };
    const res = await completePasswordResetUseCase(
      { gateway },
      { token: "x".repeat(64), password: "secret123" },
    );
    expect(res.status).toBe(200);
    expect(gateway.completeReset).toHaveBeenCalledWith({
      token: "x".repeat(64),
      password: "secret123",
    });
  });
});
