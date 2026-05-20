import {
  assertAtMostOneQualityChecker,
  computeTeamValidity,
} from './report-team-validity';

describe('assertAtMostOneQualityChecker', () => {
  it('allows zero or one quality checker', () => {
    expect(() =>
      assertAtMostOneQualityChecker(['hunter', 'mentor']),
    ).not.toThrow();
    expect(() =>
      assertAtMostOneQualityChecker(['hunter', 'quality_checker']),
    ).not.toThrow();
  });

  it('throws when more than one quality checker', () => {
    expect(() =>
      assertAtMostOneQualityChecker([
        'hunter',
        'quality_checker',
        'quality_checker',
      ]),
    ).toThrow('at most one quality checker');
  });
});

describe('computeTeamValidity', () => {
  it('returns valid when hunter, QC and mentor are present', () => {
    expect(
      computeTeamValidity(['hunter', 'quality_checker', 'mentor']),
    ).toBe('valid');
  });

  it('returns valid with hunter and quality checker only', () => {
    expect(computeTeamValidity(['hunter', 'quality_checker'])).toBe('valid');
  });

  it('returns valid with hunter and mentor only', () => {
    expect(computeTeamValidity(['hunter', 'mentor'])).toBe('valid');
  });

  it('returns incomplete when hunter is missing', () => {
    expect(computeTeamValidity(['quality_checker', 'mentor'])).toBe(
      'incomplete',
    );
  });

  it('returns incomplete when hunter has no mentor or QC', () => {
    expect(computeTeamValidity(['hunter'])).toBe('incomplete');
  });
});
