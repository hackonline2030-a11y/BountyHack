import type { Resource } from "i18next";
import enAdministration from "@/app/i18n/locales/en/administration.json";
import enCommon from "@/app/i18n/locales/en/common.json";
import enConnexion from "@/app/i18n/locales/en/connexion.json";
import enCredits from "@/app/i18n/locales/en/credits.json";
import enLegal from "@/app/i18n/locales/en/legal.json";
import enMyReports from "@/app/i18n/locales/en/myReports.json";
import enParameters from "@/app/i18n/locales/en/parameters.json";
import enPasswordReset from "@/app/i18n/locales/en/passwordReset.json";
import enRegister from "@/app/i18n/locales/en/register.json";
import enReportTeams from "@/app/i18n/locales/en/reportTeams.json";
import enWelcomeAdmin from "@/app/i18n/locales/en/welcomeAdmin.json";
import enWelcomeCoordinator from "@/app/i18n/locales/en/welcomeCoordinator.json";
import enWelcomeHunter from "@/app/i18n/locales/en/welcomeHunter.json";
import enWelcomeMentor from "@/app/i18n/locales/en/welcomeMentor.json";
import enWelcomePlatformManager from "@/app/i18n/locales/en/welcomePlatformManager.json";
import enWelcomeQualityChecker from "@/app/i18n/locales/en/welcomeQualityChecker.json";
import frAdministration from "@/app/i18n/locales/fr/administration.json";
import frCommon from "@/app/i18n/locales/fr/common.json";
import frConnexion from "@/app/i18n/locales/fr/connexion.json";
import frCredits from "@/app/i18n/locales/fr/credits.json";
import frLegal from "@/app/i18n/locales/fr/legal.json";
import frMyReports from "@/app/i18n/locales/fr/myReports.json";
import frParameters from "@/app/i18n/locales/fr/parameters.json";
import frPasswordReset from "@/app/i18n/locales/fr/passwordReset.json";
import frRegister from "@/app/i18n/locales/fr/register.json";
import frReportTeams from "@/app/i18n/locales/fr/reportTeams.json";
import frWelcomeAdmin from "@/app/i18n/locales/fr/welcomeAdmin.json";
import frWelcomeCoordinator from "@/app/i18n/locales/fr/welcomeCoordinator.json";
import frWelcomeHunter from "@/app/i18n/locales/fr/welcomeHunter.json";
import frWelcomeMentor from "@/app/i18n/locales/fr/welcomeMentor.json";
import frWelcomePlatformManager from "@/app/i18n/locales/fr/welcomePlatformManager.json";
import frWelcomeQualityChecker from "@/app/i18n/locales/fr/welcomeQualityChecker.json";

/**
 * Every namespace used by client components (`useT` from `next-i18next/client`)
 * must be listed here so `I18nProvider` hydrates translations. Server-only pages
 * can still use `getT` with dynamic imports via `i18n.config.ts`.
 */
export const clientI18nNamespaces = [
  "common",
  "connexion",
  "register",
  "administration",
  "passwordReset",
  "welcomeHunter",
  "welcomeQualityChecker",
  "welcomeMentor",
  "welcomeCoordinator",
  "welcomeAdmin",
  "welcomePlatformManager",
  "reportTeams",
  "parameters",
  "legal",
  "credits",
  "myReports",
] as const;

export type ClientI18nNamespace = (typeof clientI18nNamespaces)[number];

export const clientI18nResources = {
  en: {
    common: enCommon,
    connexion: enConnexion,
    register: enRegister,
    administration: enAdministration,
    passwordReset: enPasswordReset,
    welcomeHunter: enWelcomeHunter,
    welcomeQualityChecker: enWelcomeQualityChecker,
    welcomeMentor: enWelcomeMentor,
    welcomeCoordinator: enWelcomeCoordinator,
    welcomeAdmin: enWelcomeAdmin,
    welcomePlatformManager: enWelcomePlatformManager,
    reportTeams: enReportTeams,
    parameters: enParameters,
    legal: enLegal,
    credits: enCredits,
    myReports: enMyReports,
  },
  fr: {
    common: frCommon,
    connexion: frConnexion,
    register: frRegister,
    administration: frAdministration,
    passwordReset: frPasswordReset,
    welcomeHunter: frWelcomeHunter,
    welcomeQualityChecker: frWelcomeQualityChecker,
    welcomeMentor: frWelcomeMentor,
    welcomeCoordinator: frWelcomeCoordinator,
    welcomeAdmin: frWelcomeAdmin,
    welcomePlatformManager: frWelcomePlatformManager,
    reportTeams: frReportTeams,
    parameters: frParameters,
    legal: frLegal,
    credits: frCredits,
    myReports: frMyReports,
  },
} satisfies Resource;
