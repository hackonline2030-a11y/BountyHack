const CODE_PATTERN = /^[A-Za-z0-9]{2,32}$/;

export function assertValidCriterionCode(code: string): void {
  const trimmed = code.trim();
  if (!CODE_PATTERN.test(trimmed)) {
    throw new Error(
      'Criterion code must be 2–32 alphanumeric characters (A–Z, a–z, 0–9)',
    );
  }
}

export function normalizeCriterionCode(code: string): string {
  return code.trim().toUpperCase();
}
