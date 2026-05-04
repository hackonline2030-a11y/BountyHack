import { JsonCvRepositoryAdapter } from './json-cv.repository';

describe('JsonCvRepositoryAdapter', () => {
  it('maps cv.json to template view model', async () => {
    const repository = new JsonCvRepositoryAdapter();

    const result = (await repository.getCvTemplateData()).toReadModel();

    expect(result.fullName).toBeTruthy();
    expect(result.jobTitle).toBeTruthy();
    expect(result.leftColumn.skills.length).toBeGreaterThan(0);
    expect(result.rightColumn.experiences.length).toBeGreaterThan(0);
    expect(result.leftColumn.portfolio.url).toBeTruthy();
  });
});
