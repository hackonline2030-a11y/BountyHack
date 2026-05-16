/**
 * Pure CVSS 3.1 base-score computation. No React, no Redux — kept as a
 * domain primitive so the preview and the PDF backend can both consume it
 * later without dragging the report-draft slice along.
 *
 * Inputs use the single-character notation from the CVSS vector spec (e.g.
 * AV ∈ {N, A, L, P}). An empty string means "not selected yet" — the
 * computed helpers return `null` instead of throwing in that case, so the
 * UI can render "N/A" gracefully.
 *
 * Source for the formula and numeric weights:
 * https://www.first.org/cvss/v3.1/specification-document
 */

export type CvssMetrics = {
  attackVector: string;
  attackComplexity: string;
  privilegesRequired: string;
  userInteraction: string;
  scope: string;
  confidentiality: string;
  integrity: string;
  availability: string;
};

export type CvssSeverity = "None" | "Low" | "Medium" | "High" | "Critical";

const AV_WEIGHT: Record<string, number> = {
  N: 0.85,
  A: 0.62,
  L: 0.55,
  P: 0.2,
};

const AC_WEIGHT: Record<string, number> = {
  L: 0.77,
  H: 0.44,
};

/** PR weights depend on the Scope metric (per CVSS 3.1 spec table). */
const PR_WEIGHT_UNCHANGED: Record<string, number> = {
  N: 0.85,
  L: 0.62,
  H: 0.27,
};

const PR_WEIGHT_CHANGED: Record<string, number> = {
  N: 0.85,
  L: 0.68,
  H: 0.5,
};

const UI_WEIGHT: Record<string, number> = {
  N: 0.85,
  R: 0.62,
};

const CIA_WEIGHT: Record<string, number> = {
  N: 0,
  L: 0.22,
  H: 0.56,
};

const allFilled = (m: CvssMetrics): boolean =>
  m.attackVector !== "" &&
  m.attackComplexity !== "" &&
  m.privilegesRequired !== "" &&
  m.userInteraction !== "" &&
  m.scope !== "" &&
  m.confidentiality !== "" &&
  m.integrity !== "" &&
  m.availability !== "";

/**
 * CVSS-specific rounding: `roundUp1` per the 3.1 spec (Appendix A). Uses
 * integer math to dodge FP precision quirks that the naive
 * `Math.ceil(x * 10) / 10` introduces near boundaries.
 */
const roundUp1 = (input: number): number => {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
};

/**
 * Canonical CVSS 3.1 base vector — `CVSS:3.1/AV:.../AC:.../...`. Returns
 * `null` if any metric is missing (we'd otherwise emit an invalid vector
 * like `AV:/AC:L/...` which is worse than no string at all).
 */
export const cvssVector = (m: CvssMetrics): string | null => {
  if (!allFilled(m)) return null;
  return (
    `CVSS:3.1` +
    `/AV:${m.attackVector}` +
    `/AC:${m.attackComplexity}` +
    `/PR:${m.privilegesRequired}` +
    `/UI:${m.userInteraction}` +
    `/S:${m.scope}` +
    `/C:${m.confidentiality}` +
    `/I:${m.integrity}` +
    `/A:${m.availability}`
  );
};

/**
 * CVSS 3.1 base score, in the range [0.0, 10.0]. Returns `null` when any
 * metric is missing — callers should render "N/A" rather than 0.0 in that
 * case (a real 0.0 means "no impact across C/I/A", which is different from
 * "not yet scored").
 */
export const cvssBaseScore = (m: CvssMetrics): number | null => {
  if (!allFilled(m)) return null;

  const av = AV_WEIGHT[m.attackVector];
  const ac = AC_WEIGHT[m.attackComplexity];
  const prTable = m.scope === "C" ? PR_WEIGHT_CHANGED : PR_WEIGHT_UNCHANGED;
  const pr = prTable[m.privilegesRequired];
  const ui = UI_WEIGHT[m.userInteraction];
  const c = CIA_WEIGHT[m.confidentiality];
  const i = CIA_WEIGHT[m.integrity];
  const a = CIA_WEIGHT[m.availability];

  if (
    av === undefined ||
    ac === undefined ||
    pr === undefined ||
    ui === undefined ||
    c === undefined ||
    i === undefined ||
    a === undefined
  ) {
    return null;
  }

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact =
    m.scope === "C"
      ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
      : 6.42 * iss;

  if (impact <= 0) return 0.0;

  const exploitability = 8.22 * av * ac * pr * ui;
  const raw =
    m.scope === "C"
      ? Math.min(1.08 * (impact + exploitability), 10)
      : Math.min(impact + exploitability, 10);

  return roundUp1(raw);
};

/** Maps a base score to the qualitative severity rating per the spec. */
export const cvssSeverity = (score: number | null): CvssSeverity | null => {
  if (score === null) return null;
  if (score === 0.0) return "None";
  if (score < 4.0) return "Low";
  if (score < 7.0) return "Medium";
  if (score < 9.0) return "High";
  return "Critical";
};
