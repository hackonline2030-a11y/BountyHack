import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@xample.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'username123' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(12)
  password: string;
}

/**
 * DTO for user login
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  password: string;

  @ApiProperty({ required: false, example: '123456' })
  @IsString()
  twoFactorToken?: string; // 2FA code if used
}

/**
 * Auth response (register, login)
 */
export interface AuthResponse {
  token: string;
  user: {
    uid: string;
    email: string;
    username: string;
  };
  require2FA?: boolean; // If 2FA is activated but code is not provided
}

// 2FA Auth example

// /**
//  * Secret 2FA avec QR code
//  */
// export interface TwoFactorSecret {
//   secret: string;      // Secret base32
//   qrCode: string;      // Data URL du QR code
//   backupCodes?: string[]; // Codes de secours optionnels
// }

// /**
//  * DTO pour activer le 2FA
//  */
// export class Enable2FADto {
//   @ApiProperty({ example: '123456' })
//   @IsString()
//   token: string; // TOTP code to verify the user scanned the QR code
// }

// /**
//  * DTO pour vérifier le 2FA lors du login
//  */
// export class Verify2FADto {
//   @ApiProperty({ example: 'user-uuid' })
//   @IsString()
//   userId: string;
//
//   @ApiProperty({ example: '123456' })
//   @IsString()
//   token: string; // 6 digit TOTP code
// }