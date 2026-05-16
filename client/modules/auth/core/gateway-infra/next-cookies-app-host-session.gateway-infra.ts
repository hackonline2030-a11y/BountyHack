import { cookies } from "next/headers";
import type { IAppHostSessionGateway } from "../gateway/app-host-session.gateway";
import { ACCESS_TOKEN_COOKIE_NAME } from "../model/session.constants";

export class NextCookiesAppHostSessionGateway implements IAppHostSessionGateway {
  constructor(
    private readonly cookieName: string = ACCESS_TOKEN_COOKIE_NAME,
  ) {}

  async getRawAccessToken(): Promise<string | null> {
    const value = (await cookies()).get(this.cookieName)?.value;
    return value?.trim() ? value.trim() : null;
  }

  async setHttpOnlyAccessCookie(
    token: string,
    maxAgeSeconds: number,
  ): Promise<void> {
    const isProd = process.env.NODE_ENV === "production";
    (await cookies()).set(this.cookieName, token.trim(), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });
  }

  async clearAccessCookie(): Promise<void> {
    (await cookies()).delete(this.cookieName);
  }
}
