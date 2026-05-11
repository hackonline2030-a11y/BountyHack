import { nestAuthAbsoluteUrl } from "@/lib/nest-auth-url";
import type {
  IPasswordResetGateway,
  PasswordResetCompleteInput,
  PasswordResetRequestInput,
} from "../gateway/password-reset.gateway";

/** Direct `fetch` to Nest auth routes (same origin policy as `postAuthLogin`; `credentials: omit`). */
export class NestDirectPasswordResetGateway implements IPasswordResetGateway {
  requestReset(input: PasswordResetRequestInput): Promise<Response> {
    return fetch(nestAuthAbsoluteUrl("/password-reset/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        email: input.email,
        locale: input.locale,
      }),
    });
  }

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
