import { Logger } from '@nestjs/common';
import type {
  ITransactionalMailPort,
  OutboundEmailPayload,
} from '../../ports/transactional-mail.port';

export class ConsoleTransactionalMailAdapter implements ITransactionalMailPort {
  private readonly logger = new Logger(ConsoleTransactionalMailAdapter.name);

  async send(payload: OutboundEmailPayload): Promise<void> {
    this.logger.log(
      `[TransactionalMail:console] to=${payload.to} subject=${payload.subject}`,
    );
    this.logger.debug(payload.text);
  }
}
