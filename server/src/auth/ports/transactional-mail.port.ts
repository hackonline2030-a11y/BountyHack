/** Outbound transactional email (password reset, etc.) — implementation chooses Mailgun, Brevo, SMTP, or console. */
export const TRANSACTIONAL_MAIL_PORT = Symbol('TRANSACTIONAL_MAIL_PORT');

export type OutboundEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface ITransactionalMailPort {
  send(payload: OutboundEmailPayload): Promise<void>;
}
