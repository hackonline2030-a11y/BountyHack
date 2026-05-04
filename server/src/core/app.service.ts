import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomTexts(): { title: string, description: string } {
    return {
      title: 'Generate CV API',
      description:
        'API dédiée à la prévisualisation et à la génération de CV PDF, avec authentification, profils utilisateurs et endpoints documentés dans Swagger.',
    };
  }

  getHomeActions(): { docs: string; dashboard: string } {
    return {
      docs: 'Consulter les docs (swagger)',
      dashboard: 'Ouvrir le dashboard CV',
    };
  }

  getDashboardTexts(): {
    title: string;
    description: string;
    pickerHint: string;
    previewTitle: string;
    generateButton: string;
    backButton: string;
    openVersionPrefix: string;
    languageLabel: string;
  } {
    return {
      title: 'Dashboard CV',
      description:
        'Prévisualise le CV HTML et génère un PDF en réutilisant les endpoints API existants.',
      pickerHint: 'Parcours le référentiel CV : style (declinaison), puis version, puis langue.',
      previewTitle: 'Aperçu HTML',
      generateButton: 'Générer le PDF',
      backButton: 'Retour à l’accueil',
      openVersionPrefix: 'Ouvrir ',
      languageLabel: 'Langue',
    };
  }
}
