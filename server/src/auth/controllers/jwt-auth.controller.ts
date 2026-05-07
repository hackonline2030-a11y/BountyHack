import { Body, Controller, Post, Inject } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiHttpConflict,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { AuthRepository } from '../ports/auth.repository';
import { RegisterDto, LoginDto } from '../dto/auth-common.dto';
import {
  JwtAuthResponseDto,
  JwtLoginRequestDto,
  JwtRegisterRequestDto,
} from '../dto/jwt-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class JwtAuthController {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register with JWT credentials',
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
    body: JwtRegisterRequestDto
  ) {
    const registerDto: RegisterDto = {
      email: body.email,
      username: body.username,
      password: body.password,
    };

    return this.authRepository.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with JWT credentials',
    description: 'Authenticates user credentials and returns an access token.',
  })
  @ApiBody({ type: JwtLoginRequestDto })
  @ApiOkResponse({ description: 'Authentication succeeded.', type: JwtAuthResponseDto })
  @ApiValidationBadRequest('Request body does not pass validation (email, password).')
  @ApiHttpUnauthorized('Invalid credentials.')
  @ApiHttpInternalServerError('JWT auth is unavailable for current backend mode.')
  async login(
    @Body()
    body: JwtLoginRequestDto
  ) {
    const loginDto: LoginDto = {
      email: body.email,
      password: body.password,
    };

    return this.authRepository.login(loginDto);
  }
}
