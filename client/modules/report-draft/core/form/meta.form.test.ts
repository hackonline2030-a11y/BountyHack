import { MetaForm } from "@modules/report-draft/core/form/meta.form";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";

describe("MetaForm", () => {
  const form = new MetaForm();

  describe("setField", () => {
    it("returns a new object (immutable) without mutating the input", () => {
      const initial = MetaFactory.create({ bugType: "" });

      const updated = form.setField(initial, "bugType", "XSS");

      expect(updated).not.toBe(initial);
      expect(updated.bugType).toEqual("XSS");
      expect(initial.bugType).toEqual("");
    });
  });

  describe("isSubmitable", () => {
    it("returns true for an empty draft (V1 — no field gates)", () => {
      expect(form.isSubmitable(MetaFactory.create())).toBe(true);
    });

    it("returns true when all fields are filled", () => {
      expect(
        form.isSubmitable(
          MetaFactory.create({
            reportTitle: "Title",
            bugType: "XSS",
            scopeSlug: "scope",
            endpoint: "/api",
            vulnerablePartCategory: "input",
            vulnerablePartName: "q",
            payload: "p",
            technicalEnvironment: "env",
            ipsUsed: "1.2.3.4",
          }),
        ),
      ).toBe(true);
    });
  });
});
