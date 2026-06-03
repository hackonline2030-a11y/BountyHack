import { nestAuthAbsoluteUrl } from "@/lib/nest-auth-url";
import type {
  IPasswordResetGateway,
  PasswordResetCompleteInput,
} from "../gateway/password-reset.gateway";

/** Direct `fetch` to Nest auth routes (same origin policy as `postAuthLogin`; `credentials: omit`). */
export class NestDirectPasswordResetGateway implements IPasswordResetGateway {
  completeReset(input: PasswordResetCompleteInput): Promise<Response> {
    return fetch(nestAuthAbsoluteUrl("/password-reset/confirm"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        token: input.token,
        password: input.password,
      }),
    });
  }
}
