import { applyDecorators, UseGuards } from '@nestjs/common';
import { PassportJwtAuthGuard } from './adapters/passport-jwt/guards/passport-jwt-auth.guard';

export function Auth() {
  return applyDecorators(
    UseGuards(PassportJwtAuthGuard)
  );
}
