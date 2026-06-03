export type PasswordResetCompleteInput = {
  token: string;
  password: string;
};

/**
 * Outbound port: public Nest `POST …/auth/password-reset/confirm` (no cookies, direct browser → API).
 */
export interface IPasswordResetGateway {
  completeReset(input: PasswordResetCompleteInput): Promise<Response>;
}
