import { MetaForm } from "@modules/report-draft/core/form/meta.form";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

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

    it("only touches the targeted field", () => {
      const initial = MetaFactory.create({
        bugType: "SQLi",
        endpoint: "/api/users",
        payload: "' OR 1=1 --",
      });

      const updated = form.setField(initial, "bugType", "XSS");

      expect(updated.bugType).toEqual("XSS");
      expect(updated.endpoint).toEqual("/api/users");
      expect(updated.payload).toEqual("' OR 1=1 --");
    });
  });

  describe("isSubmitable", () => {
    const requiredKeys: ReadonlyArray<keyof ReportDraftDomainModel.MetaFields> = [
      "reportTitle",
      "bugType",
      "scopeSlug",
      "endpoint",
      "vulnerablePartCategory",
      "vulnerablePartName",
      "payload",
      "technicalEnvironment",
      "ipsUsed",
    ];

    const allFilled = MetaFactory.create({
      reportTitle: "Path Traversal on /api/sign via filename parameter",
      bugType: "XSS",
      scopeSlug: "*.example.com",
      endpoint: "/api/login",
      vulnerablePartCategory: "input",
      vulnerablePartName: "email",
      payload: "<script>alert(1)</script>",
      technicalEnvironment: "Chrome 134 / Linux",
      applicationFingerprint: "Next.js 16",
      cve: "",
      impact: "session hijack",
      ipsUsed: "203.0.113.4",
    });

    it("returns true when every required field is filled", () => {
      expect(form.isSubmitable(allFilled)).toBe(true);
    });

    it("ignores non-required fields (applicationFingerprint, cve, impact)", () => {
      const onlyRequired = MetaFactory.create({
        reportTitle: "Path Traversal on /api/sign",
        bugType: "XSS",
        scopeSlug: "*.example.com",
        endpoint: "/api/login",
        vulnerablePartCategory: "input",
        vulnerablePartName: "email",
        payload: "x",
        technicalEnvironment: "Chrome",
        ipsUsed: "1.2.3.4",
      });

      expect(form.isSubmitable(onlyRequired)).toBe(true);
    });

    it.each(requiredKeys)(
      "returns false when required field '%s' is empty",
      (key) => {
        const withMissing = { ...allFilled, [key]: "" };

        expect(form.isSubmitable(withMissing)).toBe(false);
      },
    );

    it.each(requiredKeys)(
      "returns false when required field '%s' contains only whitespace",
      (key) => {
        const withWhitespace = { ...allFilled, [key]: "   " };

        expect(form.isSubmitable(withWhitespace)).toBe(false);
      },
    );

    it("returns false on a freshly created empty MetaFields", () => {
      expect(form.isSubmitable(MetaFactory.create())).toBe(false);
    });
  });
});