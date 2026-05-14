import { IIdProvider } from "@modules/core/provider/id-provider";

/**
 * Deterministic `IIdProvider` for tests.
 *
 * - Constructor with a sequence: returns ids in the given order, then throws
 *   when exhausted (loud test-author error — better than silent reuse).
 * - Constructor with no argument: emits `stub-id-1`, `stub-id-2`, … forever.
 */
export class StubIdProvider implements IIdProvider {
  private cursor = 0;
  private readonly sequence: ReadonlyArray<string> | null;

  constructor(sequence?: ReadonlyArray<string>) {
    this.sequence = sequence ?? null;
  }

  next(): string {
    if (this.sequence === null) {
      this.cursor += 1;
      return `stub-id-${this.cursor}`;
    }

    if (this.cursor >= this.sequence.length) {
      throw new Error(
        `StubIdProvider exhausted: tried to read id #${this.cursor + 1} ` +
          `but sequence only has ${this.sequence.length} entries.`,
      );
    }

    const id = this.sequence[this.cursor];
    this.cursor += 1;
    return id;
  }
}