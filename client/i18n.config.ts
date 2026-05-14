import type { I18nConfig } from 'next-i18next/proxy'

const i18nConfig: I18nConfig = {
  supportedLngs: ['en', 'fr'],
  fallbackLng: 'en',
  localeInPath: true,
  defaultNS: 'common',
  ns: [
    'common',
    'connexion',
    'register',
    'administration',
    'passwordReset',
    'welcomeHunter',
    'welcomeQualityChecker',
    'parameters',
    'legal',
    'credits',
  ],
  resourceLoader: (language, namespace) =>
    import(`./app/i18n/locales/${language}/${namespace}.json`),
}

export default i18nConfig
