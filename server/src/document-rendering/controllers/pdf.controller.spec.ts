import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PreviewReportHtmlQuery } from '../application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from '../application/commands/generate-report-pdf.command';

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

    const result = await controller.previewReportHtml();

    expect(previewReportQueryMock.execute).toHaveBeenCalledWith({});
    expect(result).toBe('<html>report preview</html>');
  });

  it('returns generated report pdf url from use case', async () => {
    generateReportCommandMock.execute.mockResolvedValue({
      url: '/pdfs/report-final-1.pdf',
    });

    const result = await controller.exportReportPDF();

    expect(generateReportCommandMock.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({
      url: '/pdfs/report-final-1.pdf',
    });
  });
});
