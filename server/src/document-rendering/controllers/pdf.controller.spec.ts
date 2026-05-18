import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PreviewReportHtmlQuery } from '../application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from '../application/commands/generate-report-pdf.command';

const REPORT_ID = 'bbbbbbbb-0002-4000-8000-000000000001';

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

    const result = await controller.previewReportHtml(REPORT_ID, 'fr');

    expect(previewReportQueryMock.execute).toHaveBeenCalledWith({
      reportId: REPORT_ID,
      locale: 'fr',
    });
    expect(result).toBe('<html>report preview</html>');
  });

  it('throws when reportId is missing', async () => {
    await expect(controller.previewReportHtml()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns generated report pdf url from use case', async () => {
    generateReportCommandMock.execute.mockResolvedValue({
      url: '/pdfs/report-final-1.pdf',
    });

    const result = await controller.exportReportPDF(REPORT_ID);

    expect(generateReportCommandMock.execute).toHaveBeenCalledWith({
      reportId: REPORT_ID,
    });
    expect(result).toEqual({
      url: '/pdfs/report-final-1.pdf',
    });
  });

  it('throws when reportId is missing for PDF export', async () => {
    await expect(controller.exportReportPDF()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
