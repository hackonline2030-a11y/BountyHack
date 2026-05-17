import { computeTeamValidity } from './report-team-validity';

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
