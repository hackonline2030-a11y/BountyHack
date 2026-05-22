const MAX_EXPLANATION_WORDS = 200;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/u).length;
}

export function assertExplanationWordLimit(
  explanation: string | null | undefined,
): void {
  if (explanation === null || explanation === undefined) {
    return;
  }
  const trimmed = explanation.trim();
  if (!trimmed) {
    return;
  }
  if (countWords(trimmed) > MAX_EXPLANATION_WORDS) {
    throw new Error(
      `Explanation must be at most ${MAX_EXPLANATION_WORDS} words`,
    );
  }
}
