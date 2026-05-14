import { DescriptionForm } from "@modules/report-draft/core/form/description.form";
import { DescriptionFactory } from "@modules/report-draft/core/model/description.factory";
import {
  cvssBaseScore,
  cvssSeverity,
  cvssVector,
} from "@modules/report-draft/core/cvss/cvss-3.1";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

describe("DescriptionForm", () => {
  const form = new DescriptionForm();

  describe("setField", () => {
    it("returns a new object without mutating the input", () => {
      const initial = DescriptionFactory.create();

      const updated = form.setField(initial, "attackVector", "N");

      expect(updated).not.toBe(initial);
      expect(updated.attackVector).toEqual("N");
      expect(initial.attackVector).toEqual("");
    });

    it("only touches the targeted metric", () => {
      const initial = DescriptionFactory.create({
        attackVector: "N",
        privilegesRequired: "L",
      });

      const updated = form.setField(initial, "attackVector", "P");

      expect(updated.attackVector).toEqual("P");
      expect(updated.privilegesRequired).toEqual("L");
    });
  });

  describe("isSubmitable", () => {
    it("returns false on a freshly created empty DescriptionFields", () => {
      expect(form.isSubmitable(DescriptionFactory.create())).toBe(false);
    });

    it("returns true when both required metrics are filled (AV + PR)", () => {
      const required = DescriptionFactory.create({
        attackVector: "N",
        privilegesRequired: "N",
      });

      expect(form.isSubmitable(required)).toBe(true);
    });

    it("returns false when attackVector is missing, even if other metrics are set", () => {
      const missingAV = DescriptionFactory.create({
        attackVector: "",
        privilegesRequired: "L",
        userInteraction: "N",
        scope: "U",
        confidentiality: "H",
        integrity: "H",
        availability: "H",
      });

      expect(form.isSubmitable(missingAV)).toBe(false);
    });

    it("returns false when privilegesRequired is missing, even if everything else is set", () => {
      const missingPR = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "",
        userInteraction: "N",
        scope: "U",
        confidentiality: "H",
        integrity: "H",
        availability: "H",
      });

      expect(form.isSubmitable(missingPR)).toBe(false);
    });

    it("returns false when required metrics contain only whitespace", () => {
      const whitespace = DescriptionFactory.create({
        attackVector: "  ",
        privilegesRequired: "\t",
      });

      expect(form.isSubmitable(whitespace)).toBe(false);
    });
  });

  describe("CVSS derivations stay in sync with DescriptionFields", () => {
    it("returns null vector / score / severity on partial input", () => {
      const partial = DescriptionFactory.create({
        attackVector: "N",
        privilegesRequired: "N",
      });

      expect(cvssVector(partial)).toBeNull();
      expect(cvssBaseScore(partial)).toBeNull();
      expect(cvssSeverity(cvssBaseScore(partial))).toBeNull();
    });

    it("computes the canonical CVSS 3.1 vector when all 8 metrics are filled", () => {
      const full = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "N",
        userInteraction: "N",
        scope: "U",
        confidentiality: "H",
        integrity: "H",
        availability: "H",
      });

      expect(cvssVector(full)).toEqual(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      );
    });

    it("scores AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H as 9.8 Critical (reference CVE example)", () => {
      const critical = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "N",
        userInteraction: "N",
        scope: "U",
        confidentiality: "H",
        integrity: "H",
        availability: "H",
      });

      const score = cvssBaseScore(critical);

      expect(score).toBeCloseTo(9.8, 1);
      expect(cvssSeverity(score)).toEqual("Critical");
    });

    it("scores AV:L/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:L as 1.8 Low", () => {
      const low = DescriptionFactory.create({
        attackVector: "L",
        attackComplexity: "H",
        privilegesRequired: "H",
        userInteraction: "R",
        scope: "U",
        confidentiality: "N",
        integrity: "N",
        availability: "L",
      });

      const score = cvssBaseScore(low);

      expect(score).toBeCloseTo(1.8, 1);
      expect(cvssSeverity(score)).toEqual("Low");
    });

    it("scores all-N impact (no C/I/A) as 0.0 None even with full attack metrics", () => {
      const none = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "N",
        userInteraction: "N",
        scope: "U",
        confidentiality: "N",
        integrity: "N",
        availability: "N",
      });

      expect(cvssBaseScore(none)).toEqual(0.0);
      expect(cvssSeverity(cvssBaseScore(none))).toEqual("None");
    });

    it("classifies a score in [4.0, 7.0) as 'Medium'", () => {
      const medium = DescriptionFactory.create({
        attackVector: "L",
        attackComplexity: "L",
        privilegesRequired: "N",
        userInteraction: "N",
        scope: "U",
        confidentiality: "L",
        integrity: "L",
        availability: "L",
      });

      const score = cvssBaseScore(medium);

      expect(score).not.toBeNull();
      expect(score!).toBeGreaterThanOrEqual(4.0);
      expect(score!).toBeLessThan(7.0);
      expect(cvssSeverity(score)).toEqual("Medium");
    });

    it("classifies a score in [7.0, 9.0) as 'High'", () => {
      const high = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "N",
        userInteraction: "N",
        scope: "U",
        confidentiality: "H",
        integrity: "L",
        availability: "L",
      });

      const score = cvssBaseScore(high);

      expect(score).not.toBeNull();
      expect(score!).toBeGreaterThanOrEqual(7.0);
      expect(score!).toBeLessThan(9.0);
      expect(cvssSeverity(score)).toEqual("High");
    });

    it("uses Scope Changed (PR_WEIGHT_CHANGED + 1.08 multiplier) when scope is 'C'", () => {
      const changed = DescriptionFactory.create({
        attackVector: "N",
        attackComplexity: "L",
        privilegesRequired: "L",
        userInteraction: "N",
        scope: "C",
        confidentiality: "H",
        integrity: "H",
        availability: "H",
      });
      const unchanged = { ...changed, scope: "U" };

      const scoreChanged = cvssBaseScore(changed);
      const scoreUnchanged = cvssBaseScore(unchanged);

      expect(scoreChanged).not.toBeNull();
      expect(scoreUnchanged).not.toBeNull();
      expect(scoreChanged!).toBeGreaterThan(scoreUnchanged!);
    });
  });

  describe("out-of-spec inputs", () => {
    const ALL_FILLED = DescriptionFactory.create({
      attackVector: "N",
      attackComplexity: "L",
      privilegesRequired: "N",
      userInteraction: "N",
      scope: "U",
      confidentiality: "H",
      integrity: "H",
      availability: "H",
    });
  
    it("returns null when attackVector has a value outside the CVSS 3.1 spec ('Z')", () => {
      const tampered = { ...ALL_FILLED, attackVector: "Z" };
  
      expect(cvssBaseScore(tampered)).toBeNull();
      expect(cvssSeverity(cvssBaseScore(tampered))).toBeNull();
    });
  
    it.each<keyof ReportDraftDomainModel.DescriptionFields>([
      "attackVector",
      "attackComplexity",
      "privilegesRequired",
      "userInteraction",
      "confidentiality",
      "integrity",
      "availability",
    ])(
      "returns null when '%s' falls outside its allowed weight table",
      (metric) => {
        const tampered = { ...ALL_FILLED, [metric]: "Z" };
  
        expect(cvssBaseScore(tampered)).toBeNull();
      },
    );
  
    it("treats an out-of-spec scope as 'unchanged' (PR_WEIGHT_UNCHANGED fallback, not null)", () => {
      const tampered = { ...ALL_FILLED, scope: "Z" };
  
      expect(cvssBaseScore(tampered)).not.toBeNull();
    });
  
    it("still emits a non-null CVSS vector for out-of-spec metrics (allFilled only checks non-empty)", () => {
      const tampered = { ...ALL_FILLED, attackVector: "Z" };
  
      expect(cvssVector(tampered)).toEqual(
        "CVSS:3.1/AV:Z/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      );
    });
  });
});



