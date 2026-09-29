import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('approved company logo integration', () => {
  it.each([
    ['components/layout/Header.tsx', 'company-logo-256.png'],
    ['components/layout/Footer.tsx', 'company-logo-256.png'],
    ['components/auth/AuthBrandPanel.tsx', 'company-logo-512.png'],
    ['app/layout.tsx', 'company-icon-32.png'],
  ])('uses the new asset in %s', (file, asset) => {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');
    expect(source).toContain(`/images/brand/${asset}`);
    expect(source).not.toContain('/images/logo-128.png');
  });
  it.each([16, 32, 180])('provides a %i px browser icon', size => {
    const png = readFileSync(path.join(process.cwd(), `public/images/brand/company-icon-${size}.png`));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  });
  it('does not bleach the official colored logo on authentication pages', () => {
    const source = readFileSync(path.join(process.cwd(), 'components/auth/AuthBrandPanel.tsx'), 'utf8');
    expect(source).not.toContain('brightness-0');
    expect(source).not.toContain(' invert');
  });
});
