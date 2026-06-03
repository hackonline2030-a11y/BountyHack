import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { ApiHttpInternalServerError } from '../../core/dto/api-http-responses';
import { HttpExceptionBodyDto } from '../../core/dto/http-exception-body.dto';
import { CompletePasswordResetCommand } from '../application/commands/complete-password-reset.command';
import { PasswordResetConfirmDto } from '../dto/password-reset.dto';
import { PasswordResetConfirmSuccessDto } from '../dto/password-reset-response.dto';
import { HitLimit } from '../../core/rate-limit/hitlimit';
import { routeHitLimits } from '../../core/rate-limit/rate-limit.limits';

/**
 * Confirmation de mot de passe via jeton opaque (e-mail super-admin : invitation ou renouvellement).
 * PostgreSQL + Prisma uniquement — voir ADR `docs/adr/architecture_server_adr.md`.
 */
@ApiTags('auth')
@Controller('auth')
export class PasswordResetController {
  constructor(
    private readonly completePasswordReset: CompletePasswordResetCommand,
  ) {}

  @Post('password-reset/confirm')
  @HitLimit(routeHitLimits.passwordResetConfirm)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmer un nouveau mot de passe avec le jeton reçu par e-mail',
    description:
      'Transaction : jeton valide et non expiré → suppression des jetons de reset pour l’utilisateur, mise à jour du hash mot de passe (scrypt), **révocation de tous les refresh tokens** Prisma pour cet utilisateur. Jeton expiré / inconnu → **400**.',
  })
  @ApiBody({ type: PasswordResetConfirmDto })
  @ApiOkResponse({
    description: 'Mot de passe mis à jour ; sessions refresh persistées révoquées.',
    type: PasswordResetConfirmSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Jeton absent, expiré ou déjà consommé (`Invalid or expired password reset token`), ou corps invalide.',
    type: HttpExceptionBodyDto,
  })
  @ApiValidationBadRequest(
    'Corps JSON invalide (token opaque, mot de passe min. 8 caractères).',
  )
  @ApiHttpInternalServerError('Erreur serveur inattendue.')
  async confirm(
    @Body() body: PasswordResetConfirmDto,
  ): Promise<{ success: true }> {
    await this.completePasswordReset.execute({
      token: body.token,
      password: body.password,
    });
    return { success: true };
  }
}
