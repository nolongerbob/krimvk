import sharp from 'sharp';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-brand-assets.mjs <approved-logo.png>');
const destination = path.resolve('public/images/brand');
await mkdir(destination, { recursive: true });
await copyFile(source, path.join(destination, 'company-logo-source.png'));
for (const size of [128, 256, 512]) {
  await sharp(source).resize(size, size, { fit: 'contain', background: '#ffffff00' })
    .png().toFile(path.join(destination, `company-logo-${size}.png`));
}
for (const size of [16, 32, 180]) {
  await sharp(source).resize(size, size, { fit: 'contain', background: '#ffffff00' })
    .flatten({ background: '#ffffff' }).png()
    .toFile(path.join(destination, `company-icon-${size}.png`));
}
