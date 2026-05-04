import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PreviewCvHtmlQuery } from '../application/queries/preview-cv-html.query';
import { GenerateCvPdfCommand } from '../application/commands/generate-cv-pdf.command';

describe('PdfController', () => {
  let controller: PdfController;
  const previewQueryMock = { execute: jest.fn() };
  const generateCommandMock = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        {
          provide: PreviewCvHtmlQuery,
          useValue: previewQueryMock,
        },
        {
          provide: GenerateCvPdfCommand,
          useValue: generateCommandMock,
        },
      ],
    }).compile();

    controller = module.get<PdfController>(PdfController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns preview html from use case', async () => {
    previewQueryMock.execute.mockResolvedValue('<html>preview</html>');

    const result = await controller.previewHtml();

    expect(previewQueryMock.execute).toHaveBeenCalledWith({});
    expect(result).toBe('<html>preview</html>');
  });

  it('returns generated pdf url from use case', async () => {
    generateCommandMock.execute.mockResolvedValue({
      url: 'http://localhost:3000/pdfs/cv-red-squared-1.pdf',
    });

    const result = await controller.exportPDF();

    expect(generateCommandMock.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({
      url: 'http://localhost:3000/pdfs/cv-red-squared-1.pdf',
    });
  });
});
