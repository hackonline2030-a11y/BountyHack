import { PreviewReportHtmlQuery } from './preview-report-html.query';

describe('PreviewReportHtmlQuery', () => {
  it('loads report data and renders html', async () => {
    const reportData = { templateName: 'report-final' };
    const documentRepository = {
      getDocumentTemplateData: jest.fn().mockResolvedValue(reportData),
    };
    const templateRenderer = {
      renderReport: jest.fn().mockResolvedValue('<html>report</html>'),
    };
    const query = new PreviewReportHtmlQuery(
      documentRepository as never,
      templateRenderer as never,
    );

    const result = await query.execute({
      draftId: 'bbbbbbbb-0001-4000-8000-000000000001',
    });

    expect(documentRepository.getDocumentTemplateData).toHaveBeenCalledWith(
      'bbbbbbbb-0001-4000-8000-000000000001',
      undefined,
    );
    expect(templateRenderer.renderReport).toHaveBeenCalledWith(reportData);
    expect(result).toBe('<html>report</html>');
  });
});
