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
      reportRepository as any,
      templateRenderer as any,
      pdfGenerator as any,
      pdfStorage as any,
    );

    const result = await command.execute();

    expect(reportRepository.getReportTemplateData).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(pdfGenerator.generateFromHtml).toHaveBeenCalledWith(
      '<html>report</html>',
    );
    expect(pdfStorage.savePdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      'report-final',
    );
    expect(result).toEqual({ url: '/pdfs/report-final-1.pdf' });
  });
});
