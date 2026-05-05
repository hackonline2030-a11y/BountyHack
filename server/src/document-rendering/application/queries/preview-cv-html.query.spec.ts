import { PreviewCvHtmlQuery } from './preview-cv-html.query';
import { CvTemplateReadModel } from '../read-models/cv-template.read-model';

describe('PreviewCvHtmlQuery', () => {
  it('loads cv data and renders html', async () => {
    const cvData: CvTemplateReadModel = {
      htmlLang: 'fr',
      labels: {
        languages: 'Langues',
        interests: 'Intérêts',
        experience: 'Expérience',
        education: 'Formation',
        previousExperience: 'Expériences antérieures',
        placeholderFullName: 'Votre Nom',
        placeholderJobTitle: 'Développeur web fullstack',
        portfolioFallback: 'Mon portfolio',
        skillGroupFallback: 'Compétence',
        roleFallback: 'Poste',
        profilePhotoAlt: 'Photo de profil',
      },
      templateName: 'red-squared',
      templateStylesheetUrl:
        '/template-assets/red-squared/styles/styles.css',
      bullets: true,
      bulletStyle: 'dot',
      bulletsColor: '#F80040',
      fullName: 'Amaury Franssen',
      jobTitle: 'Développeur web',
      summary: 'Résumé',
      profileImage: '/template-assets/logo.png',
      leftColumn: {
        portfolio: { label: 'Mon portfolio', url: 'https://example.com' },
        contact: ['mail@test.com'],
        skills: [],
        languages: [],
        interests: [],
      },
      rightColumn: {
        experiences: [],
        formations: [],
        previousExperiences: [],
      },
    };
    const cvRepository = {
      getCvTemplateData: jest.fn().mockResolvedValue(cvData),
    };
    const templateRenderer = {
      renderCv: jest.fn().mockResolvedValue('<html>ok</html>'),
    };
    const query = new PreviewCvHtmlQuery(
      cvRepository as any,
      templateRenderer as any,
    );

    const result = await query.execute();

    expect(cvRepository.getCvTemplateData).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(templateRenderer.renderCv).toHaveBeenCalledWith(cvData);
    expect(result).toBe('<html>ok</html>');
  });
});
