import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  ApiHttpConflict,
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { toRegisterWithPasswordInput } from '../adapters/http/map-jwt-register-body';
import {
  attachHttpOnlyRefreshCookie,
  clearHttpOnlyRefreshCookies,
} from '../adapters/http/jwt-refresh-cookie';
import { toJwtAuthAccessBody } from '../adapters/http/jwt-auth-access-response';
import { RegisterWithPasswordCommand } from '../application/commands/register-with-password.command';
import { LogoutSessionCommand } from '../application/commands/logout-session.command';
import { RefreshAccessTokenQuery } from '../application/queries/get-refresh-access-token.query';
import type { AuthenticatedSession } from '../application/models/authenticated-session';
import { getJwtRefreshCookieName } from '../config/auth-env';
import {
  JwtAuthResponseDto,
  JwtLoginRequestDto,
  JwtRegisterRequestDto,
} from '../dto/jwt-auth.dto';
import { AuthRoles } from '../rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

type LoginRequestWithIdentity = Request & {
  user?: AuthenticatedSession;
};

@ApiTags('auth')
@Controller('auth')
export class PassportJwtAuthController {
  constructor(
    private readonly registerWithPassword: RegisterWithPasswordCommand,
    private readonly refreshAccessTokenQuery: RefreshAccessTokenQuery,
    private readonly logoutSession: LogoutSessionCommand,
  ) {}

  @Post('register')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Register with Passport + JWT credentials',
    description:
      'Creates a user (RBAC: **SUPER_ADMIN** access JWT required). Returns short-lived access JWT in JSON and sets opaque refresh on the API origin.',
  })
  @ApiBody({ type: JwtRegisterRequestDto })
  @ApiOkResponse({
    description: 'Registration succeeded (refresh in cookie only).',
    type: JwtAuthResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation (email, non-empty fields).')
  @ApiHttpUnauthorized('Missing or invalid Bearer access token.')
  @ApiHttpForbidden('Authenticated user does not have the SUPER_ADMIN role.')
  @ApiHttpConflict('Email already registered.')
  @ApiHttpInternalServerError('JWT auth is unavailable for current backend mode.')
  async register(
    @Body() body: JwtRegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.registerWithPassword.execute(
      toRegisterWithPasswordInput(body),
    );
    attachHttpOnlyRefreshCookie(res, session.refreshToken);
    return toJwtAuthAccessBody(session);
  }

  @Post('login')
  @UseGuards(PassportAuthGuard('local'))
  @ApiOperation({
    summary: 'Login with Passport + JWT credentials',
    description:
      'Authenticates credentials, returns short-lived access JWT and sets opaque refresh cookie.',
  })
  @ApiBody({ type: JwtLoginRequestDto })
  @ApiOkResponse({
    description: 'Authentication succeeded (refresh in cookie only).',
    type: JwtAuthResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation (email, password).')
  @ApiHttpUnauthorized('Invalid credentials.')
  @ApiHttpInternalServerError('JWT auth is unavailable for current backend mode.')
  login(
    @Req() req: LoginRequestWithIdentity,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = req.user;
    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }
    attachHttpOnlyRefreshCookie(res, session.refreshToken);
    return toJwtAuthAccessBody(session);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access JWT (opaque refresh cookie)',
    description:
      `Reads cookie \`${getJwtRefreshCookieName()}\`, rotates persisted refresh token, returns new access JWT in JSON and sets new refresh cookie.`,
  })
  @ApiOkResponse({
    description: 'New access JWT; rotated refresh cookie.',
    type: JwtAuthResponseDto,
  })
  @ApiHttpUnauthorized('Missing or invalid refresh cookie.')
  @ApiHttpInternalServerError('Auth backend unavailable.')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = getJwtRefreshCookieName();
    const raw = req.cookies?.[cookieName];
    if (!raw || typeof raw !== 'string') {
      throw new UnauthorizedException('Missing refresh cookie');
    }
    const session = await this.refreshAccessTokenQuery.execute(raw.trim());
    attachHttpOnlyRefreshCookie(res, session.refreshToken);
    return toJwtAuthAccessBody(session);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout (revoke opaque refresh + clear cookie)',
    description:
      `Reads cookie \`${getJwtRefreshCookieName()}\`, revokes persisted refresh hash, clears cookie. Stateless access JWT expires on its own; clients should also drop the Next access cookie.`,
  })
  @ApiOkResponse({ description: 'Session ended.' })
  @ApiHttpInternalServerError('Auth backend unavailable.')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = getJwtRefreshCookieName();
    const raw = req.cookies?.[cookieName];
    const trimmed =
      raw && typeof raw === 'string' ? raw.trim() : undefined;

    await this.logoutSession.execute(trimmed);
    clearHttpOnlyRefreshCookies(res);
    return { ok: true as const };
  }
}
