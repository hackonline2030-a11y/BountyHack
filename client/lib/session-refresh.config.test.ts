import {
  getSessionRefreshIntervalMs,
  parseSessionRefreshIntervalMs,
} from "@/lib/session-refresh.config";

describe("session-refresh.config", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("parseSessionRefreshIntervalMs accepts duration suffixes", () => {
    expect(parseSessionRefreshIntervalMs("12m")).toBe(12 * 60 * 1000);
    expect(parseSessionRefreshIntervalMs("90s")).toBe(90 * 1000);
    expect(parseSessionRefreshIntervalMs("720000")).toBe(720000);
    expect(parseSessionRefreshIntervalMs("")).toBeNull();
    expect(parseSessionRefreshIntervalMs("nope")).toBeNull();
  });

  it("getSessionRefreshIntervalMs prefers *_MS over duration", () => {
    process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL = "12m";
    process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS = "600000";
    expect(getSessionRefreshIntervalMs()).toBe(600000);
  });

  it("getSessionRefreshIntervalMs uses duration when *_MS unset", () => {
    delete process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS;
    process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL = "10m";
    expect(getSessionRefreshIntervalMs()).toBe(10 * 60 * 1000);
  });

  it("getSessionRefreshIntervalMs defaults to 12m", () => {
    delete process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS;
    delete process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL;
    expect(getSessionRefreshIntervalMs()).toBe(12 * 60 * 1000);
  });
});
