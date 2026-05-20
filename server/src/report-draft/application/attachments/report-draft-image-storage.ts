import { basename, dirname, resolve, sep } from 'path';

export const REPORT_DRAFT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const REPORT_DRAFT_IMAGE_FIELD_NAME = 'file';

export type UploadedReportImageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ValidReportImage = {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  extension: 'png' | 'jpg' | 'webp';
};

const ASSETS_ROOT = resolve(
  process.cwd(),
  'templates',
  'report-final',
  'assets',
);

const UPLOAD_STORAGE_PREFIX = 'uploads/report-drafts';

function safePathSegment(value: string): string {
  const safe = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return safe || 'unknown';
}

export function sanitizeReportImageFilename(
  originalName: string,
  extension: ValidReportImage['extension'],
): string {
  const withoutPath = basename(originalName || `report-image.${extension}`);
  const withoutExtension = withoutPath.replace(/\.[^.]*$/, '');
  const safeBase = withoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return `${safeBase || 'report-image'}.${extension}`;
}

export function validateReportImageUpload(file: UploadedReportImageFile): ValidReportImage {
  if (!file?.buffer?.length) {
    throw new Error('Image file is required.');
  }
  if (file.size > REPORT_DRAFT_IMAGE_MAX_BYTES) {
    throw new Error('Image file exceeds the 10 MB limit.');
  }

  const mimeType = sniffImageMimeType(file.buffer);
  if (mimeType === null) {
    throw new Error('Only PNG, JPG, and WEBP images are allowed.');
  }
  if (file.mimetype !== mimeType) {
    throw new Error('Image content does not match its declared MIME type.');
  }

  return {
    mimeType,
    extension: mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'webp',
  };
}

function sniffImageMimeType(buffer: Buffer): ValidReportImage['mimeType'] | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function reportImageStorageKey(input: {
  draftId: string;
  stepKey: string;
  attachmentId: string;
  extension: ValidReportImage['extension'];
}): string {
  return [
    UPLOAD_STORAGE_PREFIX,
    safePathSegment(input.draftId),
    safePathSegment(input.stepKey),
    `${safePathSegment(input.attachmentId)}.${input.extension}`,
  ].join('/');
}

export function resolveReportImageAssetPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = resolve(ASSETS_ROOT, normalized);
  const rootPrefix = ASSETS_ROOT.endsWith(sep) ? ASSETS_ROOT : `${ASSETS_ROOT}${sep}`;

  if (!absolutePath.startsWith(rootPrefix)) {
    throw new Error('Invalid report image storage key.');
  }

  return absolutePath;
}

export function reportImageDirectory(storageKey: string): string {
  return dirname(resolveReportImageAssetPath(storageKey));
}
