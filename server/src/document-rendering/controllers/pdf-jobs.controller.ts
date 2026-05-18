import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { EnqueueReportPdfJobDto } from '../dto/enqueue-report-pdf-job.dto';
import type { ReportPdfJobPayload } from '../application/models/report-pdf-job-payload';
import {
  PDF_GENERATION_QUEUE,
  REPORT_PDF_JOB_NAME,
} from '../infrastructure/queue/pdf-generation.constants';

class EnqueueReportPdfResponseDto {
  @ApiProperty({ example: 'PDF generation has been queued successfully' })
  message!: string;

  @ApiProperty({ example: '42' })
  jobId!: string;
}

class ReportPdfJobStatusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description: 'BullMQ state',
    enum: [
      'completed',
      'failed',
      'active',
      'waiting',
      'delayed',
      'paused',
      'prioritized',
    ],
  })
  state!: string;

  @ApiPropertyOptional({
    description:
      'Suggested download filename when completed. Use `GET /pdf/export` with the same draftId to download the PDF.',
  })
  fileName?: string;

  @ApiPropertyOptional()
  failedReason?: string;
}

/**
 * Async PDF pipeline (Medium article pattern): **enqueue** here, **process** in {@link ReportPdfProcessor}.
 *
 * - **Security (layer 1)**: `POST` / `GET` require a valid JWT (`@Auth()`). We stamp `requestedByUid` on the job
 *   so only that user can read job status (Redis alone does not authenticate — the API gate does).
 * - **Why Redis**: shared queue + persistence for retries; workers may run in the same process (here) or
 *   a dedicated deployment later without changing the use case.
 */
@ApiTags('pdf')
@ApiBearerAuth('bearer')
@AuthRoles(AppRoleCode.SUPER_ADMIN)
@Controller('pdf/jobs')
export class PdfJobsController {
  constructor(
    @InjectQueue(PDF_GENERATION_QUEUE)
    private readonly pdfQueue: Queue<ReportPdfJobPayload, { url: string }>,
  ) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({
    summary: 'Queue report PDF generation',
    description:
      'Accepts draftId (and optional lang), enqueues BullMQ work, returns immediately with `jobId`. Poll GET /pdf/jobs/:jobId until `state` is `completed` or `failed`.',
  })
  @ApiResponse({
    status: 202,
    description: 'Job accepted — PDF generation runs asynchronously.',
    type: EnqueueReportPdfResponseDto,
  })
  async enqueueReportPdf(
    @Body() body: EnqueueReportPdfJobDto,
    @Req() req: RequestWithIdentity,
  ): Promise<EnqueueReportPdfResponseDto> {
    const payload: ReportPdfJobPayload = {
      requestedByUid: req.user.uid,
      draftId: body.draftId,
      ...(body.lang !== undefined ? { locale: body.lang } : {}),
    };

    const job = await this.pdfQueue.add(REPORT_PDF_JOB_NAME, payload);

    return {
      message: 'PDF generation has been queued successfully',
      jobId: String(job.id),
    };
  }

  @Get(':jobId')
  @ApiOperation({
    summary: 'Report PDF job status',
    description:
      'Returns BullMQ state and, when completed, the generated file name. Download via `GET /pdf/export`. Only the user who enqueued the job may read it.',
  })
  @ApiOkResponse({ type: ReportPdfJobStatusDto })
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Req() req: RequestWithIdentity,
  ): Promise<ReportPdfJobStatusDto> {
    const job = await this.pdfQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.data?.requestedByUid !== req.user.uid) {
      throw new ForbiddenException('You do not have access to this job');
    }

    const state = await job.getState();
    const dto: ReportPdfJobStatusDto = {
      id: String(job.id),
      state,
    };

    if (state === 'completed') {
      const rv = job.returnvalue as { fileName?: string } | undefined;
      if (rv?.fileName) {
        dto.fileName = rv.fileName;
      }
    }

    if (state === 'failed') {
      dto.failedReason = job.failedReason ?? 'Unknown failure';
    }

    return dto;
  }
}
