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
      reportRepository as never,
      templateRenderer as never,
    );

    const result = await query.execute({
      reportId: 'bbbbbbbb-0002-4000-8000-000000000001',
    });

    expect(reportRepository.getReportTemplateData).toHaveBeenCalledWith(
      'bbbbbbbb-0002-4000-8000-000000000001',
      undefined,
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(result).toBe('<html>report</html>');
  });
});
