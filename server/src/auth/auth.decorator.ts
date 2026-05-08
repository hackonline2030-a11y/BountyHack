import { applyDecorators, UseGuards } from '@nestjs/common';
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';

export function Auth() {
  return applyDecorators(
    UseGuards(PassportJwtAuthGuard)
  );
}
