import { IClockProvider } from "@modules/core/provider/clock-provider";

/**
 * Production adapter for {@link IClockProvider} backed by the system clock.
 *
 * Returns an ISO 8601 timestamp in UTC (e.g. `"2026-05-14T22:00:00.000Z"`),
 * consumable as-is by Postgres `timestamptz` columns and JSON APIs.
 *
 * Tests should use `StubClockProvider` for deterministic timestamps.
 */
export class SystemClockProvider implements IClockProvider {
  now(): string {
    return new Date().toISOString();
  }
}
