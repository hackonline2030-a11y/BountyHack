import { AppRoleCode } from '../../shared/rbac/app-role.code';
import {
  reportTeamRoleFromAppRoleCode,
  reportTeamRoleFromIdentity,
} from './report-team-member-role-from-app-role';

describe('reportTeamRoleFromAppRoleCode', () => {
  it('maps hunter, mentor, and quality checker', () => {
    expect(reportTeamRoleFromAppRoleCode(AppRoleCode.HUNTER)).toBe('hunter');
    expect(reportTeamRoleFromAppRoleCode(AppRoleCode.MENTOR)).toBe('mentor');
    expect(reportTeamRoleFromAppRoleCode(AppRoleCode.QUALITY_CHECKER)).toBe(
      'quality_checker',
    );
  });

  it('rejects coordinator and other non-team roles', () => {
    expect(() => reportTeamRoleFromAppRoleCode(AppRoleCode.COORDINATOR)).toThrow(
      'cannot be assigned',
    );
  });
});

describe('reportTeamRoleFromIdentity', () => {
  it('uses JWT roleCode', () => {
    expect(
      reportTeamRoleFromIdentity({
        uid: 'u1',
        email: 'h@x.com',
        roleCode: AppRoleCode.HUNTER,
      }),
    ).toBe('hunter');
  });
});
