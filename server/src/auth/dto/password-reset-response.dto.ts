import { ApiProperty } from '@nestjs/swagger';

/** Corps JSON renvoyé par `POST …/auth/password-reset/confirm` (code 200). */
export class PasswordResetConfirmSuccessDto {
  @ApiProperty({
    example: true,
    description: 'Mot de passe mis à jour et jetons de session refresh révoqués.',
  })
  success: boolean;
}
