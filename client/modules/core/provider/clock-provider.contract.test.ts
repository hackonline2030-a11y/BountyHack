import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";

describe("StubClockProvider", () => {
  it("returns ISO timestamps from the sequence provided to the constructor, in order", () => {
    const clock = new StubClockProvider([
      "2026-05-14T20:00:00.000Z",
      "2026-05-14T20:05:00.000Z",
      "2026-05-14T20:10:00.000Z",
    ]);

    expect(clock.now()).toEqual("2026-05-14T20:00:00.000Z");
    expect(clock.now()).toEqual("2026-05-14T20:05:00.000Z");
    expect(clock.now()).toEqual("2026-05-14T20:10:00.000Z");
  });

  it("falls back to a deterministic 1-second-step clock when no sequence is provided", () => {
    const clock = new StubClockProvider();

    expect(clock.now()).toEqual("2024-01-01T00:00:00.000Z");
    expect(clock.now()).toEqual("2024-01-01T00:00:01.000Z");
    expect(clock.now()).toEqual("2024-01-01T00:00:02.000Z");
  });

  it("throws when the provided sequence is exhausted (test author error)", () => {
    const clock = new StubClockProvider(["2026-05-14T20:00:00.000Z"]);

    expect(clock.now()).toEqual("2026-05-14T20:00:00.000Z");
    expect(() => clock.now()).toThrow(/StubClockProvider exhausted/);
  });
});
