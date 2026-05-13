/**
 * Hardcoded list of YesWeHack program slugs surfaced in the META step's
 * "Scope" select. The store keeps only the final slug in
 * `MetaFields.scopeSlug`; UI derives "Other / custom" mode by checking
 * whether the slug exists in this catalog.
 *
 * Seed only carries `dojo-50` — extend as new programs are wired, or swap to
 * a backend-fetched catalog when programs become first-class entities.
 */
export const SCOPES: ReadonlyArray<string> = ["dojo-50"] as const;

/**
 * Sentinel value used by the select to mean "let me type a custom slug" —
 * NOT a stored value (the input below the select replaces it before it
 * reaches `MetaFields.scopeSlug`).
 */
export const SCOPE_OTHER_VALUE = "__other__" as const;
