/**
 * Categories of request locations where a vulnerability can sit. Stored as
 * the option `id` in `MetaFields.vulnerablePartCategory`; the specific
 * parameter / header / cookie name goes into `MetaFields.vulnerablePartName`.
 */
export type VulnerablePartOption = {
  id: string;
  label: string;
};

export const VULNERABLE_PARTS: ReadonlyArray<VulnerablePartOption> = [
  { id: "GET_PARAMETER", label: "GET parameter" },
  { id: "POST_BODY_FIELD", label: "POST body field" },
  { id: "JSON_BODY_FIELD", label: "JSON body field" },
  { id: "URL_PATH_SEGMENT", label: "URL path segment" },
  { id: "HTTP_HEADER", label: "HTTP header" },
  { id: "COOKIE", label: "Cookie" },
  { id: "MULTIPART_FIELD", label: "Multipart field" },
  { id: "OTHER", label: "Autre" },
] as const;
