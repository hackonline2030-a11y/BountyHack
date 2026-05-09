import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequestWithIdentity } from '../adapters/http/request-with-identity';
import { Auth } from '../auth.decorator';
import { TotpEnrollmentService } from '../application/totp-enrollment.service';
import { TotpEnrollmentConfirmDto } from '../dto/totp-enrollment.dto';

@ApiTags('auth')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('auth/totp')
export class TotpEnrollmentController {
  constructor(private readonly enrollment: TotpEnrollmentService) {}

  @Post('enable/start')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start TOTP enrollment',
    description:
      'Creates/refreshes a pending APP two-factor row, stores an encrypted secret, returns Base32 secret + otpauth URI + QR data URL.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        secret: 'JBSWY3…',
        otpauthUri: 'otpauth://totp/…',
        secretQrCode: 'data:image/png;base64,…',
      },
    },
  })
  start(@Req() req: RequestWithIdentity): Promise<{
    secret: string;
    otpauthUri: string;
    secretQrCode: string;
  }> {
    const { uid, email } = req.user;
    return this.enrollment.startEnrollment(uid, email);
  }

  @Post('enable/confirm')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: TotpEnrollmentConfirmDto })
  @ApiOperation({
    summary: 'Confirm TOTP enrollment',
    description:
      'Verifies a code from the authenticator app, sets two_factor.verified and twoFactorEnabled on user.',
  })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  confirm(
    @Req() req: RequestWithIdentity,
    @Body() body: TotpEnrollmentConfirmDto,
  ): Promise<{ ok: true }> {
    return this.enrollment.confirmEnrollment(req.user.uid, body.code);
  }
}
