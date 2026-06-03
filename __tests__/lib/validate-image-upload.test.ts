import { matchesImageMagic, validateImageUpload } from '@/lib/security/validate-image-upload';

describe('matchesImageMagic', () => {
  it('accepts JPEG header', () => {
    const head = new Uint8Array([0xff, 0xd8, 0xff]);
    expect(matchesImageMagic(head, 'image/jpeg')).toBe(true);
  });

  it('rejects JPEG label with PNG bytes', () => {
    const head = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(matchesImageMagic(head, 'image/jpeg')).toBe(false);
  });
});

describe('validateImageUpload', () => {
  it('rejects SVG by mime', async () => {
    const blob = new Blob(['<svg'], { type: 'image/svg+xml' });
    Object.defineProperty(blob, 'name', { value: 'x.svg' });
    expect(await validateImageUpload(blob as File)).toMatch(/JPEG|PNG|WebP|GIF/);
  });
});
