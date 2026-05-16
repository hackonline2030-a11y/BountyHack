/**
 * V1 wizard: no field-level validation gates. Hunters can save and submit
 * partial drafts while exploring the flow. Stricter rules will return in a
 * later pass (reviewer workflow + API).
 */
export const isSubmitableForWizard = (): boolean => true;
