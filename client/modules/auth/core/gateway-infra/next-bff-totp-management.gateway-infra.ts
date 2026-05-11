import type { ITotpManagementGateway } from "../gateway/totp-management.gateway";

const API_START = "/api/account/totp/enable/start";
const API_CONFIRM = "/api/account/totp/enable/confirm";
const API_DISABLE = "/api/account/totp/disable";

export class NextBffTotpManagementGateway implements ITotpManagementGateway {
  startEnable(): Promise<Response> {
    return fetch(API_START, {
      method: "POST",
      credentials: "include",
    });
  }

  confirmEnable(code: string): Promise<Response> {
    return fetch(API_CONFIRM, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }

  disable(code: string): Promise<Response> {
    return fetch(API_DISABLE, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }
}
