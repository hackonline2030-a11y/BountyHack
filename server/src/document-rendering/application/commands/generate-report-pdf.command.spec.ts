import { GenerateReportPdfCommand } from './generate-report-pdf.command';

describe('GenerateReportPdfCommand', () => {
  it('generates and stores pdf from rendered report html', async () => {
    const reportData = {
      templateName: 'report-final',
    };

    const reportRepository = {
      getReportTemplateData: jest.fn().mockResolvedValue(reportData),
    };
    const templateRenderer = {
      renderReport: jest.fn().mockResolvedValue('<html>report</html>'),
    };
    const pdfGenerator = {
      generateFromHtml: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    const pdfStorage = {
      savePdf: jest.fn().mockResolvedValue({
        fileName: 'report-final-1.pdf',
        publicUrl: '/pdfs/report-final-1.pdf',
      }),
    };

    const command = new GenerateReportPdfCommand(
      reportRepository as never,
      templateRenderer as never,
      pdfGenerator as never,
      pdfStorage as never,
    );

    const result = await command.execute({
      reportId: 'bbbbbbbb-0002-4000-8000-000000000001',
      locale: 'fr',
    });

    expect(reportRepository.getReportTemplateData).toHaveBeenCalledWith(
      'bbbbbbbb-0002-4000-8000-000000000001',
      'fr',
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(pdfGenerator.generateFromHtml).toHaveBeenCalledWith(
      '<html>report</html>',
    );
    expect(pdfStorage.savePdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      'report-final-bbbbbbbb',
    );
    expect(result).toEqual({ url: '/pdfs/report-final-1.pdf' });
  });
});
