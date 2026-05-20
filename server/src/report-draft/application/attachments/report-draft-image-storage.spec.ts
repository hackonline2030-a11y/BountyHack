import {
  reportImageStorageKey,
  resolveReportImageAssetPath,
  sanitizeReportImageFilename,
  type UploadedReportImageFile,
  validateReportImageUpload,
} from './report-draft-image-storage';

describe('report draft image storage', () => {
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const jpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
  const webpBuffer = Buffer.from('RIFFxxxxWEBP', 'ascii');

  function file(buffer: Buffer, mimetype: string): UploadedReportImageFile {
    return {
      originalname: '../evil name.png',
      mimetype,
      size: buffer.length,
      buffer,
    };
  }

  it.each([
    ['image/png', pngBuffer, 'png'],
    ['image/jpeg', jpgBuffer, 'jpg'],
    ['image/webp', webpBuffer, 'webp'],
  ] as const)('accepts %s after content sniffing', (mimetype, buffer, extension) => {
    expect(validateReportImageUpload(file(buffer, mimetype))).toEqual({
      mimeType: mimetype,
      extension,
    });
  });

  it('rejects mismatched declared MIME type', () => {
    expect(() => validateReportImageUpload(file(pngBuffer, 'image/jpeg'))).toThrow(
      /does not match/,
    );
  });

  it('sanitizes display filenames without trusting paths', () => {
    expect(sanitizeReportImageFilename('../../preuve capture!!.png', 'webp')).toBe(
      'preuve_capture.webp',
    );
  });

  it('keeps generated storage paths inside the private assets root', () => {
    const key = reportImageStorageKey({
      draftId: 'draft-1',
      stepKey: 'description',
      attachmentId: 'attachment-1',
      extension: 'png',
    });

    expect(key).toBe('uploads/report-drafts/draft-1/description/attachment-1.png');
    expect(resolveReportImageAssetPath(key)).toContain(
      'templates/report-final/assets/uploads/report-drafts/draft-1/description/attachment-1.png',
    );
    expect(() => resolveReportImageAssetPath('../../secret.png')).toThrow(/Invalid/);
  });
});
