import { applyDecorators, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';
import { isPassportJwtAuthEnabled } from './config/auth-env';

export function Auth() {
  const guardToUse = isPassportJwtAuthEnabled()
    ? PassportJwtAuthGuard
    : FirebaseAuthGuard;
  return applyDecorators(
    UseGuards(guardToUse)
  );
}
