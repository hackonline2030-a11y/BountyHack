/**
 * Curated shortlist of CWE entries surfaced in the META step's "Bug type"
 * select. The list is intentionally small (and locally maintained) — extend
 * it as new bug families show up, or swap to a backend-fetched catalog when
 * the program list is wired.
 *
 * Each `id` is the canonical CWE identifier (used as the stored value in
 * `MetaFields.bugType`); `label` is the human-readable label shown to the
 * report author.
 */
export type BugTypeOption = {
  id: string;
  label: string;
};

export const BUG_TYPES: ReadonlyArray<BugTypeOption> = [
  { id: "CWE-22", label: "Path Traversal (CWE-22)" },
  { id: "CWE-77", label: "Command Injection (CWE-77)" },
  { id: "CWE-79", label: "Cross-Site Scripting (CWE-79)" },
  { id: "CWE-89", label: "SQL Injection (CWE-89)" },
  { id: "CWE-200", label: "Information Exposure (CWE-200)" },
  { id: "CWE-287", label: "Improper Authentication (CWE-287)" },
  { id: "CWE-352", label: "Cross-Site Request Forgery (CWE-352)" },
  { id: "CWE-434", label: "Unrestricted File Upload (CWE-434)" },
  { id: "CWE-639", label: "IDOR (CWE-639)" },
  { id: "CWE-863", label: "Incorrect Authorization (CWE-863)" },
  { id: "CWE-918", label: "Server-Side Request Forgery (CWE-918)" },
] as const;
