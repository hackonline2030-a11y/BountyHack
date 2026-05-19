import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { PdfJobsController } from './pdf-jobs.controller';
import { PDF_GENERATION_QUEUE } from '../infrastructure/queue/pdf-generation.constants';
import type { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';

describe('PdfJobsController', () => {
  let controller: PdfJobsController;
  const addMock = jest.fn();
  const getJobMock = jest.fn();

  const reqUser = (uid: string): RequestWithIdentity =>
    ({
      user: { uid, email: 'test@example.com' },
    }) as RequestWithIdentity;

  beforeEach(async () => {
    addMock.mockReset();
    getJobMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfJobsController],
      providers: [
        {
          provide: getQueueToken(PDF_GENERATION_QUEUE),
          useValue: {
            add: addMock,
            getJob: getJobMock,
          },
        },
      ],
    }).compile();

    controller = module.get(PdfJobsController);
  });

  it('enqueues job with requestedByUid from JWT identity', async () => {
    addMock.mockResolvedValue({ id: 'job-99' });

    const draftId = 'bbbbbbbb-0001-4000-8000-000000000001';
    const out = await controller.enqueueReportPdf(
      { draftId, lang: 'fr' },
      reqUser('user-1'),
    );

    expect(addMock).toHaveBeenCalledWith(
      'generate-report-pdf',
      expect.objectContaining({
        requestedByUid: 'user-1',
        draftId,
        locale: 'fr',
      }),
    );
    expect(out).toEqual({
      message: 'PDF generation has been queued successfully',
      jobId: 'job-99',
    });
  });

  it('getJobStatus returns fileName when completed', async () => {
    getJobMock.mockResolvedValue({
      id: 'job-1',
      data: { requestedByUid: 'user-1' },
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: { fileName: 'report-final-bbbbbbbb.pdf' },
      failedReason: undefined,
    });

    const out = await controller.getJobStatus('job-1', reqUser('user-1'));

    expect(out.state).toBe('completed');
    expect(out.fileName).toBe('report-final-bbbbbbbb.pdf');
  });

  it('getJobStatus throws when job belongs to another user', async () => {
    getJobMock.mockResolvedValue({
      id: 'job-1',
      data: { requestedByUid: 'other' },
      getState: jest.fn(),
    });

    await expect(controller.getJobStatus('job-1', reqUser('user-1'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('getJobStatus throws NotFound when job missing', async () => {
    getJobMock.mockResolvedValue(undefined);

    await expect(controller.getJobStatus('missing', reqUser('user-1'))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
