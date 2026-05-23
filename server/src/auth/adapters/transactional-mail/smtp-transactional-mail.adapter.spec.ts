import { InternalServerErrorException } from '@nestjs/common';
import { SmtpTransactionalMailAdapter } from './smtp-transactional-mail.adapter';

describe('SmtpTransactionalMailAdapter', () => {
  const sendMail = jest.fn();

  const adapter = new SmtpTransactionalMailAdapter(
    { sendMail } as never,
    'noreply@example.com',
    'BugBountyApp',
  );

  beforeEach(() => {
    sendMail.mockReset();
  });

  it('sends with from, to, subject, text and html', async () => {
    sendMail.mockResolvedValue({ messageId: 'id-1' });

    await adapter.send({
      to: 'user@example.com',
      subject: 'Reset',
      text: 'plain',
      html: '<p>html</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'BugBountyApp <noreply@example.com>',
      to: 'user@example.com',
      subject: 'Reset',
      text: 'plain',
      html: '<p>html</p>',
    });
  });

  it('wraps transport errors as InternalServerErrorException', async () => {
    sendMail.mockRejectedValue(new Error('connection refused'));

    await expect(
      adapter.send({
        to: 'user@example.com',
        subject: 'Reset',
        text: 'plain',
        html: '<p>html</p>',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
