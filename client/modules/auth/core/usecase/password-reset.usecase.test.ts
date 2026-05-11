import { describe, expect, it } from "@jest/globals";
import type { IPasswordResetGateway } from "../gateway/password-reset.gateway";
import {
  completePasswordResetUseCase,
  requestPasswordResetUseCase,
} from "./password-reset.usecase";

function stubResponse(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

describe("password-reset use cases", () => {
  it("delegates request to gateway", async () => {
    const gateway: IPasswordResetGateway = {
      requestReset: jest.fn().mockResolvedValue(stubResponse(202)),
      completeReset: jest.fn(),
    };
    const res = await requestPasswordResetUseCase(
      { gateway },
      { email: "a@b.co", locale: "en" },
    );
    expect(res.status).toBe(202);
    expect(gateway.requestReset).toHaveBeenCalledWith({
      email: "a@b.co",
      locale: "en",
    });
  });

  it("delegates complete to gateway", async () => {
    const gateway: IPasswordResetGateway = {
      requestReset: jest.fn(),
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
