import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PreviewReportHtmlQuery } from '../application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from '../application/commands/generate-report-pdf.command';

const DRAFT_ID = 'bbbbbbbb-0001-4000-8000-000000000001';

describe('PdfController', () => {
  let controller: PdfController;
  const previewReportQueryMock = { execute: jest.fn() };
  const generateReportCommandMock = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        {
          provide: PreviewReportHtmlQuery,
          useValue: previewReportQueryMock,
        },
        {
          provide: GenerateReportPdfCommand,
          useValue: generateReportCommandMock,
        },
      ],
    }).compile();

    controller = module.get<PdfController>(PdfController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns report preview html from use case', async () => {
    previewReportQueryMock.execute.mockResolvedValue('<html>report preview</html>');

    const result = await controller.previewReportHtml(DRAFT_ID, 'fr');

    expect(previewReportQueryMock.execute).toHaveBeenCalledWith({
      draftId: DRAFT_ID,
      locale: 'fr',
    });
    expect(result).toBe('<html>report preview</html>');
  });

  it('throws when draftId is missing', async () => {
    await expect(controller.previewReportHtml()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('streams generated report pdf from in-memory buffer', async () => {
    generateReportCommandMock.execute.mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'report-final-bbbbbbbb.pdf',
    });

    const streamable = await controller.exportReportPdfDownload(DRAFT_ID);

    expect(generateReportCommandMock.execute).toHaveBeenCalledWith({
      draftId: DRAFT_ID,
    });
    expect(streamable.options.type).toBe('application/pdf');
    expect(streamable.options.disposition).toBe(
      'attachment; filename="report-final-bbbbbbbb.pdf"',
    );
  });

  it('throws when draftId is missing for PDF export', async () => {
    await expect(controller.exportReportPdfDownload()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
