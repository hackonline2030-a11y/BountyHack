import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
/** Préfixe stocké dans `two_factor_totp.secret` lorsque la valeur est chiffrée. */
export const TOTP_SECRET_SEAL_PREFIX = 'v1:';
const SCRYPT_SALT = 'bugbountyapp-totp-secret-v1';

function materialKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw || raw.length < 16) {
    throw new ServiceUnavailableException(
      'Server configuration: set TOTP_ENCRYPTION_KEY in server/.env (min 16 characters), then restart the API. ' +
        'This value is read only on the server — it is not sent from Bruno (no body/header). ' +
        'It encrypts TOTP secrets at rest in the database.',
    );
  }
  return scryptSync(raw, SCRYPT_SALT, 32);
}

/**
 * Révèle le secret Base32 utilisé avec otplib (stockage en clair hérité démo sans préfixe `v1:`).
 */
export function openTotpSecretFromStorage(stored: string): string {
  const t = stored.trim();
  if (!t.startsWith(TOTP_SECRET_SEAL_PREFIX)) {
    return t;
  }
  materialKey();
  try {
    const buf = Buffer.from(t.slice(TOTP_SECRET_SEAL_PREFIX.length), 'base64url');
    if (buf.length < IV_LEN + TAG_LEN + 1) {
      throw new Error('truncated payload');
    }
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, materialKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new InternalServerErrorException(
      'Failed to decrypt TOTP secret (wrong TOTP_ENCRYPTION_KEY or corrupted data).',
    );
  }
}

/** Chiffre le secret Base32 avant persistance. */
export function sealTotpSecretForStorage(secretPlainBase32: string): string {
  const key = materialKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secretPlainBase32, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    TOTP_SECRET_SEAL_PREFIX +
    Buffer.concat([iv, tag, ciphertext]).toString('base64url')
  );
}
