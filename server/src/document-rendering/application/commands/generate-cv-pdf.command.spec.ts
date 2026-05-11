import { GenerateCvPdfCommand } from './generate-cv-pdf.command';
import { CvTemplateReadModel } from '../read-models/cv-template.read-model';
import type { ICvRepository } from '../ports/cv-repository.port';
import type { ITemplateRenderer } from '../ports/template-renderer.port';
import type { IPdfGenerator } from '../ports/pdf-generator.port';
import type { IPdfStorage } from '../ports/pdf-storage.port';

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
    const pdfGenerator = {
      generateFromHtml: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    const pdfStorage = {
      savePdf: jest.fn().mockResolvedValue({
        fileName: 'cv-red-squared-1.pdf',
        publicUrl: '/pdfs/cv-red-squared-1.pdf',
      }),
    };

    const command = new GenerateCvPdfCommand(
      cvRepository as unknown as ICvRepository,
      templateRenderer as unknown as ITemplateRenderer,
      pdfGenerator as unknown as IPdfGenerator,
      pdfStorage as unknown as IPdfStorage,
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
    expect(result).toEqual({ url: '/pdfs/cv-red-squared-1.pdf' });
  });
});
