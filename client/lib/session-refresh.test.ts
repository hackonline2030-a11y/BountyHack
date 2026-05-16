import { getSessionRefreshIntervalMs } from "@/lib/session-refresh.config";
import { isUnauthorizedHttpError } from "@/lib/session-refresh";

describe("session-refresh", () => {
  it("default refresh interval is under typical 15m JWT lifetime", () => {
    const envBackup = { ...process.env };
    delete process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS;
    delete process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL;
    const interval = getSessionRefreshIntervalMs();
    process.env = envBackup;
    expect(interval).toBeLessThan(15 * 60 * 1000);
    expect(interval).toBeGreaterThan(5 * 60 * 1000);
  });

  it("isUnauthorizedHttpError detects BFF 401 payloads", () => {
    expect(isUnauthorizedHttpError('{"error":"Unauthorized"}')).toBe(true);
    expect(isUnauthorizedHttpError("HTTP 401")).toBe(true);
    expect(isUnauthorizedHttpError("network error")).toBe(false);
  });
});
