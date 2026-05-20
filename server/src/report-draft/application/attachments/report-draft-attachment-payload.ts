export function stripAttachmentIdFromPayload(
  payload: unknown,
  attachmentId: string,
): unknown {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const obj = payload as Record<string, unknown>;
  if (!Array.isArray(obj.sectionBlocs)) {
    return payload;
  }
  return {
    ...obj,
    sectionBlocs: (obj.sectionBlocs as Array<Record<string, unknown>>).map((bloc) =>
      bloc.attachmentId === attachmentId
        ? { ...bloc, attachmentId: null }
        : bloc,
    ),
  };
}
