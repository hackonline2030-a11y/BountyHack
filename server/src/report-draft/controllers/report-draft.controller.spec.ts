import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportDraftController } from './report-draft.controller';
import { SaveReportDraftCommand } from '../application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from '../application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from '../application/queries/list-report-drafts-by-hunter.query';
import { ReportDraftImageAssetService } from '../application/attachments/report-draft-image-asset.service';
import { SetHunterWriterCommand } from '../application/commands/set-hunter-writer.command';
import { SetPrimaryHunterCommand } from '../application/commands/set-primary-hunter.command';
import type { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import type { ReportDraftWire } from '../models/report-draft-api.types';

function minimalDraft(): ReportDraftWire {
  const emptyStep = {
    payload: {},
    attachments: [],
    status: 'in-progress' as const,
    currentRound: 0,
    assignedReviewerRole: null,
  };
  return {
    id: 'draft-1',
    hunterId: 'uid-1',
    hunterWriterId: 'uid-1',
    version: 0,
    aggregateStatus: 'draft',
    meta: emptyStep,
    description: emptyStep,
    collection: emptyStep,
    exploitation: emptyStep,
    proofOfConcept: emptyStep,
    risks: emptyStep,
    remediation: emptyStep,
    final: emptyStep,
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
  };
}

describe('ReportDraftController', () => {
  let controller: ReportDraftController;
  let saveReportDraft: jest.Mocked<SaveReportDraftCommand>;
  let getReportDraftById: jest.Mocked<GetReportDraftByIdQuery>;
  let listReportDraftsByHunter: jest.Mocked<ListReportDraftsByHunterQuery>;

  const request = {
    user: { uid: 'uid-1', email: 'test@example.com' },
  } as RequestWithIdentity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportDraftController],
      providers: [
        {
          provide: SaveReportDraftCommand,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetReportDraftByIdQuery,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListReportDraftsByHunterQuery,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ReportDraftImageAssetService,
          useValue: {},
        },
        {
          provide: SetHunterWriterCommand,
          useValue: { execute: jest.fn() },
        },
        {
          provide: SetPrimaryHunterCommand,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ReportDraftController);
    saveReportDraft = module.get(SaveReportDraftCommand);
    getReportDraftById = module.get(GetReportDraftByIdQuery);
    listReportDraftsByHunter = module.get(ListReportDraftsByHunterQuery);
  });

  it('save returns ok', async () => {
    const draft = minimalDraft();
    await expect(controller.save(request, draft)).resolves.toEqual({ ok: true });
    expect(saveReportDraft.execute).toHaveBeenCalledWith(request.user, draft);
  });

  it('getById returns draft', async () => {
    const draft = minimalDraft();
    getReportDraftById.execute.mockResolvedValue(draft);
    await expect(controller.getById(request, 'draft-1')).resolves.toEqual(draft);
  });

  it('getById throws 404 when missing', async () => {
    getReportDraftById.execute.mockResolvedValue(null);
    await expect(controller.getById(request, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('listByHunter returns drafts', async () => {
    const drafts = [minimalDraft()];
    listReportDraftsByHunter.execute.mockResolvedValue(drafts);
    await expect(
      controller.listByHunter(request, 'uid-1'),
    ).resolves.toEqual(drafts);
  });
});
