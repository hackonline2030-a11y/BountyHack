import { GenerateReportPdfCommand } from './generate-report-pdf.command';

describe('GenerateReportPdfCommand', () => {
  it('generates pdf buffer from rendered report html', async () => {
    const reportData = {
      templateName: 'report-final',
    };

    const documentRepository = {
      getDocumentTemplateData: jest.fn().mockResolvedValue(reportData),
    };
    const templateRenderer = {
      renderReport: jest.fn().mockResolvedValue('<html>report</html>'),
    };
    const pdfGenerator = {
      generateFromHtml: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };

    const command = new GenerateReportPdfCommand(
      documentRepository as never,
      templateRenderer as never,
      pdfGenerator as never,
    );

    const result = await command.execute({
      draftId: 'bbbbbbbb-0001-4000-8000-000000000001',
      locale: 'fr',
    });

    expect(documentRepository.getDocumentTemplateData).toHaveBeenCalledWith(
      'bbbbbbbb-0001-4000-8000-000000000001',
      'fr',
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(pdfGenerator.generateFromHtml).toHaveBeenCalledWith(
      '<html>report</html>',
    );
    expect(result.buffer).toEqual(Buffer.from('pdf'));
    expect(result.fileName).toBe('report-final-bbbbbbbb.pdf');
  });
});
