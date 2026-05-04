import { GenerateCvPdfCommand } from './generate-cv-pdf.command';
import { CvTemplateReadModel } from '../read-models/cv-template.read-model';

describe('GenerateCvPdfCommand', () => {
  it('generates and stores pdf from rendered cv html', async () => {
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
        'http://localhost:3000/template-assets/red-squared/styles/styles.css',
      bullets: true,
      bulletStyle: 'dot',
      bulletsColor: '#F80040',
      fullName: 'Amaury Franssen',
      jobTitle: 'Développeur web',
      summary: 'Résumé',
      profileImage: 'http://localhost:3000/template-assets/logo.png',
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
    const pdfGenerator = {
      generateFromHtml: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    const pdfStorage = {
      savePdf: jest.fn().mockResolvedValue({
        fileName: 'cv-red-squared-1.pdf',
        publicUrl: 'http://localhost:3000/pdfs/cv-red-squared-1.pdf',
      }),
    };

    const command = new GenerateCvPdfCommand(
      cvRepository as any,
      templateRenderer as any,
      pdfGenerator as any,
      pdfStorage as any,
    );

    const result = await command.execute();

    expect(cvRepository.getCvTemplateData).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(templateRenderer.renderCv).toHaveBeenCalledWith(cvData);
    expect(pdfGenerator.generateFromHtml).toHaveBeenCalledWith('<html>ok</html>');
    expect(pdfStorage.savePdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      'red-squared',
    );
    expect(result).toEqual({ url: 'http://localhost:3000/pdfs/cv-red-squared-1.pdf' });
  });
});
