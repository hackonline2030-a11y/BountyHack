import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Corps `POST …/auth/password-reset/request` — réponse HTTP neutre même si l’e-mail est inconnu. */
export class PasswordResetRequestDto {
  @ApiProperty({
    example: 'utilisateur@example.com',
    description: 'Adresse e-mail du compte à réinitialiser (normalisée en minuscules).',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: ['en', 'fr'],
    description:
      'Locale utilisée uniquement dans le chemin du lien e-mail (`/{lng}/password-reset`). Défaut : `en`.',
  })
  @IsOptional()
  @IsIn(['en', 'fr'])
  locale?: 'en' | 'fr';
}

/** Corps `POST …/auth/password-reset/confirm`. */
export class PasswordResetConfirmDto {
  @ApiProperty({
    description:
      'Jeton opaque reçu par e-mail (paramètre `token` du lien). Longueur alignée sur le jeton hex généré côté serveur.',
    example:
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    minLength: 32,
    maxLength: 256,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token: string;

  @ApiProperty({
    example: 'NouveauMotDePasseSecurise9!',
    description: 'Nouveau mot de passe (min. 8 caractères, hash scrypt en base comme le reste de l’auth).',
    minLength: 8,
    maxLength: 200,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;
}
