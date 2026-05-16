import { IClockProvider } from "@modules/core/provider/clock-provider";

/**
 * Deterministic `IClockProvider` for tests.
 *
 * - Constructor with a sequence of ISO timestamps: returns them in order,
 *   then throws when exhausted (loud test-author error — better than
 *   silent reuse).
 * - Constructor with no argument: emits `2024-01-01T00:00:00.000Z`,
 *   `2024-01-01T00:00:01.000Z`, … (one second apart, forever).
 */
const STUB_CLOCK_BASE_MS = Date.UTC(2024, 0, 1, 0, 0, 0);

export class StubClockProvider implements IClockProvider {
  private cursor = 0;
  private readonly sequence: ReadonlyArray<string> | null;

  constructor(sequence?: ReadonlyArray<string>) {
    this.sequence = sequence ?? null;
  }

  now(): string {
    if (this.sequence === null) {
      const iso = new Date(STUB_CLOCK_BASE_MS + this.cursor * 1000).toISOString();
      this.cursor += 1;
      return iso;
    }

    if (this.cursor >= this.sequence.length) {
      throw new Error(
        `StubClockProvider exhausted: tried to read timestamp #${this.cursor + 1} ` +
          `but sequence only has ${this.sequence.length} entries.`,
      );
    }

    const iso = this.sequence[this.cursor];
    this.cursor += 1;
    return iso;
  }
}
