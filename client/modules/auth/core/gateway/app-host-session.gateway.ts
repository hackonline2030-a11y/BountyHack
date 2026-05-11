/** Outbound port: persist / read session material on the app origin (Next httpOnly cookie). */
export interface IAppHostSessionGateway {
  getRawAccessToken(): Promise<string | null>;

  /**
   * @param maxAgeSeconds cookie Max-Age; must match JWT validity window left at issuance time.
   */
  setHttpOnlyAccessCookie(token: string, maxAgeSeconds: number): Promise<void>;

  clearAccessCookie(): Promise<void>;
}
