import { createAuthModule } from "@modules/auth/auth.module";
import {
  InvalidCredentialsError,
  InvalidEmailError,
} from "@modules/auth/domain/errors/errors.entity";
import { prisma } from "@/lib/prisma";
import { LoginRequestSchema } from "../schemas";

/**
 * Login API route - Infrastructure (Handler).
 * Route calls use-case directly; handles domain errors → HTTP status mapping.
 * @see https://brandonjf.github.io/brandon-clean-architecture/nextjs-integration/
 */
export async function POST(request: Request) {
  // Composition root: wire infra implementations and get use case
  const auth = createAuthModule({
    prisma,
    resendApiKey: process.env.RESEND_API_KEY!,
  });

  try {
    // Controller: parse HTTP request body (unknown until validated - Zero any)
    const rawBody: unknown = await request.json();
    // Controller: validate at boundary - safeParse returns result, no throw
    const parsed = LoginRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((issue: { message: string }) => issue.message)
        .join(", ");
      return Response.json({ error: messages }, { status: 400 });
    }
    const body = parsed.data;
    // Controller: delegate to use case (application layer)
    const result = await auth.login.execute(body);
    // Presenter: map use case output → HTTP response (200, JSON body)
    return Response.json(result);
  } catch (error) {
    // Presenter: map domain errors → HTTP status codes and response body
    if (error instanceof InvalidCredentialsError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof InvalidEmailError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    // Infrastructure: log unknown errors
    console.error("Login failed:", error);
    // Presenter: generic 500 - don't leak internal details
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
