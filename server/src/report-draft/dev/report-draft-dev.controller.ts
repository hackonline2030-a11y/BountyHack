import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ReportDraftWire, ReviewerCommentWire, SubmissionWire } from '../models/report-draft-api.types';
import {
  I_REPORT_DRAFT_REPOSITORY,
  type IReportDraftRepository,
} from '../ports/report-draft-repository.interface';
import {
  I_SUBMISSION_REPOSITORY,
  type ISubmissionRepository,
} from '../ports/submission-repository.interface';
import {
  I_REVIEWER_COMMENT_REPOSITORY,
  type IReviewerCommentRepository,
} from '../ports/reviewer-comment-repository.interface';
import { DevOnlyGuard } from './guards/dev-only.guard';

/**
 * Unauthenticated read-only mirror of report-draft APIs for local inspection.
 * DELETE this folder + ReportDraftDevModule before production deploy.
 *
 * Base path: /api/dev/report-drafts (see GLOBAL_PREFIX).
 */
@ApiTags('dev-report-drafts (local only)')
@Controller('dev/report-drafts')
@UseGuards(DevOnlyGuard)
export class ReportDraftDevController {
  constructor(
    @Inject(I_REPORT_DRAFT_REPOSITORY)
    private readonly reportDraftRepository: IReportDraftRepository,
    @Inject(I_SUBMISSION_REPOSITORY)
    private readonly submissionRepository: ISubmissionRepository,
    @Inject(I_REVIEWER_COMMENT_REPOSITORY)
    private readonly commentRepository: IReviewerCommentRepository,
  ) {}

  @Get()
  @ApiOperation({
    summary: '[DEV] List report drafts for a hunter (no auth)',
    description:
      'Same JSON as GET /report-drafts?hunterId=… without JWT. Dev only.',
  })
  async listByHunter(
    @Query('hunterId') hunterId?: string,
  ): Promise<ReportDraftWire[]> {
    if (!hunterId?.trim()) {
      return [];
    }
    return this.reportDraftRepository.findByHunterId(hunterId.trim());
  }

  @Get('draft/:draftId')
  @ApiOperation({
    summary: '[DEV] Get one report draft by id (no auth)',
    description: 'Same JSON as GET /report-drafts/draft/:draftId without JWT.',
  })
  async getDraftById(
    @Param('draftId') draftId: string,
  ): Promise<ReportDraftWire> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return draft;
  }

  @Get('draft/:draftId/inspect')
  @ApiOperation({
    summary: '[DEV] Draft + submissions + comments bundle (no auth)',
    description:
      'Convenience payload for Bruno / debugging — not used by the Next.js app.',
  })
  async inspectDraft(@Param('draftId') draftId: string): Promise<{
    draft: ReportDraftWire;
    submissions: SubmissionWire[];
    commentsBySubmissionId: Record<string, ReviewerCommentWire[]>;
    commentsByStep: ReviewerCommentWire[];
  }> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    const submissions = await this.submissionRepository.findByDraftId(draftId);
    const commentsBySubmissionId: Record<string, ReviewerCommentWire[]> = {};
    for (const sub of submissions) {
      commentsBySubmissionId[sub.id] =
        await this.commentRepository.findBySubmissionId(sub.id);
    }
    const commentsByStep: ReviewerCommentWire[] = [];
    const seenCommentIds = new Set<string>();
    for (const sub of submissions) {
      const stepComments = await this.commentRepository.findByReportDraftStep(
        draftId,
        sub.step,
      );
      for (const c of stepComments) {
        if (!seenCommentIds.has(c.id)) {
          seenCommentIds.add(c.id);
          commentsByStep.push(c);
        }
      }
    }
    return {
      draft,
      submissions,
      commentsBySubmissionId,
      commentsByStep,
    };
  }

  @Get('submissions')
  @ApiOperation({
    summary: '[DEV] List submissions for a draft (no auth)',
    description: 'Same JSON as GET /report-drafts/submissions?draftId=…',
  })
  async listSubmissions(
    @Query('draftId') draftId?: string,
  ): Promise<SubmissionWire[]> {
    if (!draftId?.trim()) {
      return [];
    }
    return this.submissionRepository.findByDraftId(draftId.trim());
  }

  @Get('submissions/:submissionId')
  @ApiOperation({
    summary: '[DEV] Get one submission by id (no auth)',
    description: 'Same JSON as GET /report-drafts/submissions/:id',
  })
  async getSubmission(
    @Param('submissionId') submissionId: string,
  ): Promise<SubmissionWire> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (submission === null) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  @Get('comments')
  @ApiOperation({
    summary: '[DEV] List reviewer comments (no auth)',
    description:
      'submissionId required. forStep=true → all comments on that wizard step.',
  })
  async listComments(
    @Query('submissionId') submissionId?: string,
    @Query('forStep') forStep?: string,
  ): Promise<ReviewerCommentWire[]> {
    if (!submissionId?.trim()) {
      return [];
    }
    const id = submissionId.trim();
    if (forStep === 'true' || forStep === '1') {
      const submission = await this.submissionRepository.findById(id);
      if (submission === null) {
        throw new NotFoundException('Submission not found');
      }
      return this.commentRepository.findByReportDraftStep(
        submission.reportDraftId,
        submission.step,
      );
    }
    return this.commentRepository.findBySubmissionId(id);
  }

  @Get('draft/:draftId/steps/:step/comments')
  @ApiOperation({
    summary: '[DEV] Comments for a draft step index (no auth)',
    description: 'step = wizard enum 0–7 (META=0, DESCRIPTION=1, …).',
  })
  async listCommentsForDraftStep(
    @Param('draftId') draftId: string,
    @Param('step', ParseIntPipe) step: number,
  ): Promise<ReviewerCommentWire[]> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return this.commentRepository.findByReportDraftStep(draftId, step);
  }
}
