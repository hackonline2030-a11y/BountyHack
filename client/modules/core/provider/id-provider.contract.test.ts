import { StubIdProvider } from "@modules/core/provider/stub.id-provider";

describe("StubIdProvider", () => {
  it("returns ids from the sequence provided to the constructor, in order", () => {
    const provider = new StubIdProvider(["draft-1", "draft-2", "draft-3"]);

    expect(provider.next()).toEqual("draft-1");
    expect(provider.next()).toEqual("draft-2");
    expect(provider.next()).toEqual("draft-3");
  });

  it("falls back to a deterministic counter when no sequence is provided", () => {
    const provider = new StubIdProvider();

    expect(provider.next()).toEqual("stub-id-1");
    expect(provider.next()).toEqual("stub-id-2");
    expect(provider.next()).toEqual("stub-id-3");
  });

  it("throws when the provided sequence is exhausted (test author error)", () => {
    const provider = new StubIdProvider(["only-one"]);

    expect(provider.next()).toEqual("only-one");
    expect(() => provider.next()).toThrow(/StubIdProvider exhausted/);
  });
});