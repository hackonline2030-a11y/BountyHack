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
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  ApiHttpConflict,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { toRegisterWithPasswordInput } from '../adapters/http/map-jwt-register-body';
import { attachHttpOnlyRefreshCookie } from '../adapters/http/jwt-refresh-cookie';
import { toJwtAuthAccessBody } from '../adapters/http/jwt-auth-access-response';
import { RegisterWithPasswordCommand } from '../application/commands/register-with-password.command';
import { RefreshAccessTokenQuery } from '../application/queries/get-refresh-access-token.query';
import type { AuthenticatedSession } from '../application/models/authenticated-session';
import { getJwtRefreshCookieName } from '../config/auth-env';
import {
  JwtAuthResponseDto,
  JwtLoginRequestDto,
  JwtRegisterRequestDto,
} from '../dto/jwt-auth.dto';

type LoginRequestWithIdentity = Request & {
  user?: AuthenticatedSession;
};

@ApiTags('auth')
@Controller('auth')
export class PassportJwtAuthController {
  constructor(
    private readonly registerWithPassword: RegisterWithPasswordCommand,
    private readonly refreshAccessTokenQuery: RefreshAccessTokenQuery,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register with Passport + JWT credentials',
    description:
      'Creates a user, returns short-lived access JWT in JSON and sets opaque refresh as httpOnly cookie.',
  })
  @ApiBody({ type: JwtRegisterRequestDto })
  @ApiOkResponse({
    description: 'Registration succeeded (refresh in cookie only).',
    type: JwtAuthResponseDto,
  })
  @ApiValidationBadRequest('Request body does not pass validation (email, non-empty fields).')
  @ApiHttpUnauthorized('Missing or invalid credentials payload.')
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
    const session = req.user!;
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
}
