const AUTH_TYPE_FIREBASE = 'FIREBASE';
const AUTH_TYPE_JWT = 'JWT';
const AUTH_TYPE_PASSPORT_JWT = 'PASSPORT_JWT';
const FIREBASE_DATABASE_NAME = 'FIREBASE';
const DEFAULT_FIREBASE_KEY_PATH = 'src/assets/web-api-firebase-key.json';

function normalizeEnvValue(value?: string): string {
  return value?.trim().toUpperCase() ?? '';
}

export function getAuthType(): string {
  return normalizeEnvValue(process.env.AUTH_TYPE) || AUTH_TYPE_JWT;
}

export function getDatabaseName(): string {
  return normalizeEnvValue(process.env.DATABASE_NAME);
}

export function isFirebaseAuthEnabled(): boolean {
  return getAuthType() === AUTH_TYPE_FIREBASE;
}

export function isLegacyJwtAuthEnabled(): boolean {
  return getAuthType() === AUTH_TYPE_JWT;
}

export function isPassportJwtAuthEnabled(): boolean {
  return getAuthType() === AUTH_TYPE_PASSPORT_JWT;
}

export function isFirebaseDatabaseEnabled(): boolean {
  return getDatabaseName() === FIREBASE_DATABASE_NAME;
}

/** Charge firebase-admin (auth + Firestore) seulement si auth Firebase ou BDD Firebase. */
export function isFirebaseRequired(): boolean {
  return isFirebaseAuthEnabled() || isFirebaseDatabaseEnabled();
}

export function getFirebaseCredentialPath(): string {
  return process.env.FIREBASE_KEY_PATH?.trim() || DEFAULT_FIREBASE_KEY_PATH;
}
