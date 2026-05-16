/**
 * Select option lists for the 8 CVSS 3.1 base metrics surfaced in the
 * DESCRIPTION step. Each `id` matches the single-character notation from
 * the CVSS vector spec — stored directly in `DescriptionFields` and
 * concatenated by `cvssVector` to build the canonical string.
 */
export type CvssMetricOption = {
  id: string;
  label: string;
};

export const ATTACK_VECTOR_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "N", label: "Network" },
  { id: "A", label: "Adjacent" },
  { id: "L", label: "Local" },
  { id: "P", label: "Physical" },
] as const;

export const ATTACK_COMPLEXITY_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "L", label: "Low" },
  { id: "H", label: "High" },
] as const;

export const PRIVILEGES_REQUIRED_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "N", label: "None" },
  { id: "L", label: "Low" },
  { id: "H", label: "High" },
] as const;

export const USER_INTERACTION_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "N", label: "None" },
  { id: "R", label: "Required" },
] as const;

export const SCOPE_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "U", label: "Unchanged" },
  { id: "C", label: "Changed" },
] as const;

export const CIA_IMPACT_OPTIONS: ReadonlyArray<CvssMetricOption> = [
  { id: "N", label: "None" },
  { id: "L", label: "Low" },
  { id: "H", label: "High" },
] as const;
