import { friendlyHttpErrorMessage } from "@/lib/http-error-message";

describe("friendlyHttpErrorMessage", () => {
  it("maps Nest 404 report draft JSON to French copy", () => {
    const raw = JSON.stringify({
      message: "Report draft not found",
      error: "Not Found",
      statusCode: 404,
    });
    expect(friendlyHttpErrorMessage(raw, 404)).toBe(
      "Ce brouillon de rapport est introuvable (supprimé ou non enregistré en base).",
    );
  });

  it("maps reviewer role 403 to French copy", () => {
    const raw = JSON.stringify({
      message: "Cannot list submissions for this reviewer role",
      statusCode: 403,
    });
    expect(friendlyHttpErrorMessage(raw, 403)).toBe(
      "Votre compte n’a pas le rôle requis pour afficher cette liste de revues.",
    );
  });
});
