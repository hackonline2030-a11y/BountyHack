import {
  allRolesRequired,
  anyRoleRequired,
  evaluateRoleValidityRules,
} from './role-validity.engine';

describe('role-validity.engine', () => {
  const hunterMentorOrQc = [
    ['hunter'],
    ['mentor', 'quality_checker'],
  ] as const;

  describe('evaluateRoleValidityRules', () => {
    it('passes when every clause is satisfied (hunter + mentor OR QC)', () => {
      expect(
        evaluateRoleValidityRules(['hunter', 'quality_checker', 'mentor'], hunterMentorOrQc),
      ).toBe(true);
      expect(
        evaluateRoleValidityRules(['hunter', 'quality_checker'], hunterMentorOrQc),
      ).toBe(true);
      expect(
        evaluateRoleValidityRules(['hunter', 'mentor'], hunterMentorOrQc),
      ).toBe(true);
    });

    it('fails when hunter clause is missing', () => {
      expect(
        evaluateRoleValidityRules(['mentor', 'quality_checker'], hunterMentorOrQc),
      ).toBe(false);
    });

    it('fails when neither mentor nor QC is present', () => {
      expect(evaluateRoleValidityRules(['hunter'], hunterMentorOrQc)).toBe(false);
    });
  });

  describe('allRolesRequired', () => {
    const allThree = allRolesRequired([
      'hunter',
      'mentor',
      'quality_checker',
    ] as const);

    it('requires every role (legacy AND)', () => {
      expect(
        evaluateRoleValidityRules(['hunter', 'mentor', 'quality_checker'], allThree),
      ).toBe(true);
      expect(
        evaluateRoleValidityRules(['hunter', 'quality_checker'], allThree),
      ).toBe(false);
    });
  });

  describe('anyRoleRequired', () => {
    it('requires at least one role from the clause', () => {
      const rules = anyRoleRequired(['mentor', 'quality_checker'] as const);
      expect(evaluateRoleValidityRules(['mentor'], rules)).toBe(true);
      expect(evaluateRoleValidityRules(['hunter'], rules)).toBe(false);
    });
  });
});
