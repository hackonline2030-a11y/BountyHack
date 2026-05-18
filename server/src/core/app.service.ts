import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomTexts(): { title: string; description: string } {
    return {
      title: 'Bug Bounty Report API',
      description:
        'API dédiée à la prévisualisation et à la génération de rapports PDF, avec authentification, profils utilisateurs et endpoints documentés dans Swagger.',
    };
  }

  getHomeActions(): { docs: string; dashboard: string } {
    return {
      docs: 'Consulter les docs (swagger)',
      dashboard: 'Ouvrir le dashboard rapport',
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
      title: 'Dashboard rapport',
      description:
        'Prévisualise le rapport HTML et génère un PDF en réutilisant les endpoints API existants.',
      pickerHint:
        'Choisis un rapport promu en base (frozen_content), puis prévisualise ou génère le PDF.',
      previewTitle: 'Aperçu HTML',
      generateButton: 'Générer le PDF',
      backButton: 'Retour à l’accueil',
      openVersionPrefix: 'Ouvrir ',
      languageLabel: 'Langue',
    };
  }
}
