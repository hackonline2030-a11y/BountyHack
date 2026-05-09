import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiHttpConflict,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { toRegisterWithPasswordInput } from '../adapters/http/map-jwt-register-body';
import { RegisterWithPasswordCommand } from '../application/commands/register-with-password.command';
import type { AuthenticatedSession } from '../application/models/authenticated-session';
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
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register with Passport + JWT credentials',
    description: 'Creates a new user account and returns an access token.',
  })
  @ApiBody({ type: JwtRegisterRequestDto })
  @ApiOkResponse({ description: 'Registration succeeded.', type: JwtAuthResponseDto })
  @ApiValidationBadRequest('Request body does not pass validation (email, non-empty fields).')
  @ApiHttpUnauthorized('Missing or invalid credentials payload.')
  @ApiHttpConflict('Email already registered.')
  @ApiHttpInternalServerError('JWT auth is unavailable for current backend mode.')
  async register(
    @Body()
    body: JwtRegisterRequestDto,
  ) {
    return this.registerWithPassword.execute(toRegisterWithPasswordInput(body));
  }

  @Post('login')
  @UseGuards(PassportAuthGuard('local'))
  @ApiOperation({
    summary: 'Login with Passport + JWT credentials',
    description: 'Authenticates user credentials and returns an access token.',
  })
  @ApiBody({ type: JwtLoginRequestDto })
  @ApiOkResponse({ description: 'Authentication succeeded.', type: JwtAuthResponseDto })
  @ApiValidationBadRequest('Request body does not pass validation (email, password).')
  @ApiHttpUnauthorized('Invalid credentials.')
  @ApiHttpInternalServerError('JWT auth is unavailable for current backend mode.')
  login(@Req() req: LoginRequestWithIdentity) {
    return req.user;
  }
}
