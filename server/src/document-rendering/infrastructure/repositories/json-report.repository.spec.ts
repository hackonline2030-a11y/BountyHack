import { JsonReportRepositoryAdapter } from './json-report.repository';

describe('JsonReportRepositoryAdapter', () => {
  it('maps report.json to template view model', async () => {
    const repository = new JsonReportRepositoryAdapter();

    const result = (await repository.getReportTemplateData()).toReadModel();

    expect(result.templateName).toBeTruthy();
    expect(result.sections.length).toBeGreaterThan(0);
  });
});
