import { PreviewReportHtmlQuery } from './preview-report-html.query';

describe('PreviewReportHtmlQuery', () => {
  it('loads report data and renders html', async () => {
    const reportData = { templateName: 'report-final' };
    const reportRepository = {
      getReportTemplateData: jest.fn().mockResolvedValue(reportData),
    };
    const templateRenderer = {
      renderReport: jest.fn().mockResolvedValue('<html>report</html>'),
    };
    const query = new PreviewReportHtmlQuery(
      reportRepository as any,
      templateRenderer as any,
    );

    const result = await query.execute();

    expect(reportRepository.getReportTemplateData).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(result).toBe('<html>report</html>');
  });
});
