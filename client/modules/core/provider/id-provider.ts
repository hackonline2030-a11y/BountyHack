/**
 * Hexagonal port for generating opaque, unique identifiers.
 *
 * Production uses a `SystemIdProvider` (UUIDv7 / crypto.randomUUID), tests
 * use `StubIdProvider` for deterministic ids.
 */
export interface IIdProvider {
    next(): string;
  }