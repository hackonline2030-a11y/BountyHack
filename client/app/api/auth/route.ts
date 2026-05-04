import { createAuthModule } from "@modules/auth/auth.module";
import {
  UserAlreadyExistsError,
  InvalidEmailError,
} from "@modules/auth/domain/errors/errors.entity";
import { prisma } from "@/lib/prisma";

/**
 * Register API route (legacy path) - Infrastructure (Handler).
 * Route calls use-case directly; handles domain errors → HTTP status mapping.
 * Prefer POST /api/auth/register for new code.
 */
export async function POST(request: Request) {
  // Composition root: wire infra implementations and get use case
  const auth = createAuthModule({
    prisma,
    resendApiKey: process.env.RESEND_API_KEY!,
  });

  try {
    // Controller: parse HTTP request body into raw input
    const body = await request.json();
    // Controller: delegate to use case (application layer)
    const result = await auth.registerUser.execute(body);
    // Presenter: map use case output → HTTP response (200, JSON body)
    return Response.json(result);
  } catch (error) {
    // Presenter: map domain errors → HTTP status codes and response body
    if (error instanceof UserAlreadyExistsError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof InvalidEmailError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    // Infrastructure: log unknown errors
    console.error("Registration failed:", error);
    // Presenter: generic 500 - don't leak internal details
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}