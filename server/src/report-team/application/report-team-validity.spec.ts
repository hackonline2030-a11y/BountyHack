import { computeTeamValidity } from './report-team-validity';

describe('computeTeamValidity', () => {
  it('returns valid when hunter, QC and mentor are present', () => {
    expect(
      computeTeamValidity(['hunter', 'quality_checker', 'mentor']),
    ).toBe('valid');
  });

  it('returns incomplete when a required role is missing', () => {
    expect(computeTeamValidity(['hunter', 'quality_checker'])).toBe('incomplete');
  });
});
