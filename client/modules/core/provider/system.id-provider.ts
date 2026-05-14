import { IIdProvider } from "@modules/core/provider/id-provider";

/**
 * Production adapter for {@link IIdProvider} backed by the Web Crypto API.
 *
 * Returns RFC 4122 v4 UUIDs (e.g. `"f81d4fae-7dec-11d0-a765-00a0c91e6bf6"`).
 * `crypto.randomUUID()` is exposed by every modern browser and by Node ≥ 19,
 * so this adapter works on both client and server runtimes.
 *
 * Tests should use `StubIdProvider` for deterministic ids.
 */
export class SystemIdProvider implements IIdProvider {
  next(): string {
    return crypto.randomUUID();
  }
}
