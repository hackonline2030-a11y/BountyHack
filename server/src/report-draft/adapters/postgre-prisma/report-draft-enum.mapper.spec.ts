import { DraftStep, ReviewerRole, SubmissionDecision } from '../../../generated/prisma/enums';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';

describe('ReportDraftEnumMapper', () => {
  it('maps step numbers to DraftStep and back', () => {
    expect(ReportDraftEnumMapper.draftStepFromStepNumber(0)).toBe(DraftStep.META);
    expect(ReportDraftEnumMapper.stepNumberFromDraftStep(DraftStep.FINAL)).toBe(7);
  });

  it('maps reviewer roles', () => {
    expect(ReportDraftEnumMapper.reviewerRoleToWire(ReviewerRole.QUALITY_CHECKER)).toBe(
      'quality_checker',
    );
    expect(
      ReportDraftEnumMapper.reviewerRoleFromWire('quality_checker'),
    ).toBe(ReviewerRole.QUALITY_CHECKER);
  });

  it('maps submission decisions', () => {
    expect(ReportDraftEnumMapper.decisionToWire(SubmissionDecision.REQUEST_CHANGES)).toBe(
      'request-changes',
    );
    expect(ReportDraftEnumMapper.decisionFromWire('approve')).toBe(
      SubmissionDecision.APPROVE,
    );
  });
});
