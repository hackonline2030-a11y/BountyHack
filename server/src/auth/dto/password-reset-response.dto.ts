import { ApiProperty } from '@nestjs/swagger';

/** Corps JSON renvoyé par `POST …/auth/password-reset/request` (code 202). */
export class PasswordResetRequestAcceptedDto {
  @ApiProperty({
    example: true,
    description:
      'Toujours `true` lorsque le corps de la requête est valide (indépendamment de l’existence du compte — anti-énumération).',
  })
  acknowledged: boolean;
}

/** Corps JSON renvoyé par `POST …/auth/password-reset/confirm` (code 200). */
export class PasswordResetConfirmSuccessDto {
  @ApiProperty({
    example: true,
    description: 'Mot de passe mis à jour et jetons de session refresh révoqués.',
  })
  success: boolean;
}
