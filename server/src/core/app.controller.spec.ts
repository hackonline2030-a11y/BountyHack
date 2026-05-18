import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { I_REPORT_DRAFT_DOCUMENT_REPOSITORY } from '../document-rendering/application/ports/report-draft-document-repository.port';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getWelcomTexts: jest.fn(),
            getHomeActions: jest.fn(),
          },
        },
        {
          provide: I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
          useValue: {
            listPublishedDrafts: jest.fn().mockResolvedValue([]),
            getDocumentTemplateData: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);
  });

  it('should return landing page model from AppService', () => {
    appService.getWelcomTexts.mockReturnValue({
      title: 'Bienvenue',
      description: 'Description',
    });
    appService.getHomeActions.mockReturnValue({
      docs: 'Docs',
      dashboard: 'Dashboard',
    });

    const result = controller.getHomePage();

    expect(result).toEqual({
      title: 'Bienvenue',
      description: 'Description',
      docsBtnText: 'Docs',
      dashboardBtnText: 'Dashboard',
      docsUrl: '/api/docs',
      dashboardUrl: '/api/dashboard',
    });
  });
});
