import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { Auth } from '../../auth/auth.decorator';

import { AddUsername } from '../commands/add-username';
import {
  CreateUserProfileBodyDto,
  UserProfileResponseDto,
} from '../dto/user.dto';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { Identity } from '../../auth/domain/models/identity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly addUsername: AddUsername,
    private readonly getUserByIdQuery: GetUserByIdQuery
  ) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Create or complete current user profile',
    description: 'Sets profile data for the authenticated user.',
  })
  @ApiBody({ type: CreateUserProfileBodyDto })
  @ApiOkResponse({ description: 'User profile created/updated.', schema: { example: null } })
  @ApiValidationBadRequest('Request body does not pass validation (username).')
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while creating profile.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateUserProfileBodyDto
  ) {
    const identity = this.getAuthenticatedIdentity(request);

    try {
      const data = {
        uid: identity.uid,
        username: body.username,
      };

      await this.addUsername.execute(data);
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns current authenticated user details.',
  })
  @ApiOkResponse({
    description: 'User profile returned.',
    type: UserProfileResponseDto,
  })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while loading profile.')
  async getCurrentUser(
    @Req() request: RequestWithIdentity
  ): Promise<UserProfileResponseDto> {
    const identity = this.getAuthenticatedIdentity(request);

    try {
      const record = await this.getUserByIdQuery.execute(identity.uid);
      return plainToInstance(
        UserProfileResponseDto,
        {
          ...record,
          roleCode: identity.roleCode ?? null,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  private getAuthenticatedIdentity(request: RequestWithIdentity): Identity {
    if (!request.user?.uid) {
      throw new UnauthorizedException('Utilisateur non authentifie');
    }
    return request.user;
  }

}
