import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
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
import { RequestPasswordResetCommand } from '../application/commands/request-password-reset.command';
import {
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from '../dto/password-reset.dto';
import {
  PasswordResetConfirmSuccessDto,
  PasswordResetRequestAcceptedDto,
} from '../dto/password-reset-response.dto';

/**
 * Réinitialisation mot de passe (PostgreSQL + Prisma uniquement — voir ADR `docs/adr/architecture_server_adr.md`).
 * OpenAPI : tag **`auth`**, chemins sous le préfixe global (ex. `/api/auth/...`).
 */
@ApiTags('auth')
@Controller('auth')
export class PasswordResetController {
  constructor(
    private readonly requestPasswordReset: RequestPasswordResetCommand,
    private readonly completePasswordReset: CompletePasswordResetCommand,
  ) {}

  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Demander un lien de réinitialisation (e-mail)',
    description:
      '**Anti-énumération** : statut et corps identiques que l’adresse existe ou non. Si un compte avec mot de passe local existe, un jeton opaque est persisté (hash SHA-256) et un e-mail est envoyé (`MAIL_PROVIDER`). Le lien n’est jamais renvoyé dans le JSON de réponse.',
  })
  @ApiBody({ type: PasswordResetRequestDto })
  @ApiAcceptedResponse({
    description:
      'Demande acceptée. `acknowledged` est toujours `true` pour un corps valide (ne pas en déduire qu’un compte existe).',
    type: PasswordResetRequestAcceptedDto,
  })
  @ApiValidationBadRequest(
    'Corps JSON invalide (email obligatoire, locale optionnelle en|fr).',
  )
  @ApiResponse({
    status: 503,
    description:
      'Envoi e-mail impossible (fournisseur transactionnel configuré, clé API, ou réseau). Body type `HttpExceptionBodyDto`.',
    type: HttpExceptionBodyDto,
  })
  @ApiHttpInternalServerError('Erreur serveur inattendue.')
  async request(@Body() body: PasswordResetRequestDto): Promise<{ acknowledged: true }> {
    await this.requestPasswordReset.execute({
      email: body.email,
      locale: body.locale,
    });
    return { acknowledged: true };
  }

  @Post('password-reset/confirm')
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
