import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isReportDraftDevRoutesEnabled } from '../../../shared/dev-routes.util';

/** Hides dev routes outside development (404, no auth bypass leak). */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (!isReportDraftDevRoutesEnabled()) {
      throw new NotFoundException();
    }
    return true;
  }
}
