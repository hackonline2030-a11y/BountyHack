import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { AuthResponse } from '../dto/auth-common.dto';
import { TotpSignInDemoService } from '../application/demo/totp-sign-in-demo.service';
import { JwtLoginRequestDto } from '../dto/jwt-auth.dto';
import { TotpDemoVerifyRequestDto } from '../dto/totp-demo.dto';
import { variables } from '../../shared/variables.config';

/**
 * Démo navigateur : même idée que les articles Express / Logto (QR après sign-in),
 * en NestJS + EJS — uniquement avec `DATABASE_NAME=POSTGRESQL_PRISMA`.
 */
@ApiExcludeController()
@Controller('demo')
export class TotpSignInDemoController {
  constructor(private readonly totpSignInDemo: TotpSignInDemoService) {}

  @Get('totp-sign-in')
  @Render('totp-sign-in-demo')
  totpSignInPage(): { apiPrefix: string } {
    const segment = variables.globalPrefix.replace(/^\/+|\/+$/g, '');
    return { apiPrefix: `/${segment}` };
  }

  /**
   * Réponse d’erreur volontaire pour coller au pattern article : 403 + JSON
   * (`missing_totp` + `secretQrCode` en data URL, ou `totp_verification_required`).
   */
  @Post('totp-sign-in/step')
  async totpSignInStep(
    @Body() body: JwtLoginRequestDto,
  ): Promise<void> {
    await this.totpSignInDemo.afterPasswordCheck(body.email, body.password);
  }

  /** Équivalent Logto `/verify-totp` : valide le premier code et active le TOTP sur le compte. */
  @Post('totp-sign-in/verify')
  verifyTotpBinding(
    @Body() body: TotpDemoVerifyRequestDto,
  ): Promise<{ ok: true; message: string }> {
    return this.totpSignInDemo.verifyBinding(body.email, body.password, body.code);
  }

  /** Connexion lorsque le TOTP est déjà lié : même réponse que `POST /auth/login`. */
  @Post('totp-sign-in/complete')
  completeSignInWithTotp(
    @Body() body: TotpDemoVerifyRequestDto,
  ): Promise<AuthResponse> {
    return this.totpSignInDemo.completeLoginWithTotp(
      body.email,
      body.password,
      body.code,
    );
  }
}
