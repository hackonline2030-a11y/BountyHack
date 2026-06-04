import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { RegisterWithPasswordInput } from '../../application/models/register-with-password.input';
import type { JwtRegisterRequestDto } from '../../dto/jwt-auth.dto';

/** Maps validated HTTP register body → application-layer register input (port boundary). */
export function toRegisterWithPasswordInput(
  body: JwtRegisterRequestDto,
): RegisterWithPasswordInput {
  return {
    email: body.email,
    username: body.username,
    roleCode: body.roleCode ?? AppRoleCode.USER,
    locale: body.locale,
    fakeUser: body.fakeUser === true,
  };
}
