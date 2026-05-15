import { messageFromNestBody } from "@/lib/auth-api";

/**
 * Turns a raw BFF/Nest response body (often JSON) into user-facing French copy.
 */
export function friendlyHttpErrorMessage(
  body: string,
  status: number,
  fallback = "Une erreur est survenue. Réessayez ou reconnectez-vous.",
): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return fallback;
  }

  let data: unknown = trimmed;
  try {
    data = JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed.length > 160 ? fallback : trimmed;
  }

  const record =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : null;
  const statusCode =
    typeof record?.statusCode === "number" ? record.statusCode : status;
  const nestMessage = messageFromNestBody(data, fallback);

  if (statusCode === 401) {
    return nestMessage;
  }

  if (statusCode === 403) {
    if (nestMessage.includes("reviewer role")) {
      return "Votre compte n’a pas le rôle requis (quality checker) pour afficher cette liste.";
    }
    if (nestMessage.includes("report draft")) {
      return "Accès refusé à ce brouillon de rapport.";
    }
    return nestMessage;
  }

  if (statusCode === 404) {
    if (nestMessage.toLowerCase().includes("report draft")) {
      return "Ce brouillon de rapport est introuvable (supprimé ou non enregistré en base).";
    }
    if (nestMessage.toLowerCase().includes("submission")) {
      return "Cette soumission est introuvable.";
    }
    return "Ressource introuvable.";
  }

  return nestMessage;
}

export async function readFriendlyHttpError(
  res: Response,
  fallback?: string,
): Promise<string> {
  const text = await res.text();
  return friendlyHttpErrorMessage(text, res.status, fallback);
}
