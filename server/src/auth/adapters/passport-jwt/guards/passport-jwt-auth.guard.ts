import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

/** HTTP boundary: Passport JWT authentication for protected routes. */
@Injectable()
export class PassportJwtAuthGuard extends PassportAuthGuard('jwt') {}
