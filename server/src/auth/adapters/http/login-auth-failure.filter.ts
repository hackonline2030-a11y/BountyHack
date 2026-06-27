import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { shouldBlacklistIpOnLoginFailure } from '../../application/login-ip-blacklist.policy';
import { BlacklistClientIpCommand } from '../../../ip-access/application/commands/blacklist-client-ip.command';
import { resolveClientIp } from '../../../shared/http/client-ip.util';
import { isIpAccessEnabled } from '../../../shared/is-ip-access-enabled';

function isAuthLoginPost(req: Request): boolean {
  if ((req.method ?? '').toUpperCase() !== 'POST') {
    return false;
  }
  const path = (req.path || req.url || '').split('?')[0];
  return path.endsWith('/auth/login');
}

@Injectable()
@Catch(UnauthorizedException)
export class LoginAuthFailureFilter implements ExceptionFilter {
  constructor(
    private readonly blacklistClientIp: BlacklistClientIpCommand,
  ) {}

  async catch(exception: UnauthorizedException, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (
      isIpAccessEnabled() &&
      isAuthLoginPost(req) &&
      shouldBlacklistIpOnLoginFailure(exception)
    ) {
      await this.blacklistClientIp.execute({
        clientIp: resolveClientIp(req),
        reason: 'login_failed',
      });
    }

    const status = exception.getStatus();
    res.status(status).json(exception.getResponse());
  }
}
