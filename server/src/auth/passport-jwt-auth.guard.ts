import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class PassportJwtAuthGuard extends PassportAuthGuard('jwt') {}
