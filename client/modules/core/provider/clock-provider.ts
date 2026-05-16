/**
 * Hexagonal port for reading the current wall-clock time.
 *
 * Production uses a `SystemClockProvider` backed by `Date.now()` /
 * `new Date().toISOString()`; tests use `StubClockProvider` for
 * deterministic timestamps.
 *
 * Returns an ISO 8601 string (e.g. `"2026-05-14T20:00:00.000Z"`) so
 * callers can persist it as-is without timezone surprises.
 */
export interface IClockProvider {
  now(): string;
}
