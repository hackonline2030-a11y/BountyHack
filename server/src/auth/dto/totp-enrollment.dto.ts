import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

/** Après scan du QR : confirme l’Authenticator avec un code une fois. */
export class TotpEnrollmentConfirmDto {
  @ApiProperty({ example: '123456', description: 'Code TOTP (6 chiffres typiquement).' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '') : value))
  @IsString()
  @Matches(/^\d{6,8}$/)
  code: string;
}
