#!/usr/bin/env node
/**
 * Переписать в БД старые URL storage.yandexcloud.net → https://ваш-сайт/files/...
 * Требует NEXTAUTH_URL в .env
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { loadEnv } = require('./scripts/load-env');
const { PrismaClient } = require('@prisma/client');

loadEnv();

const base = (process.env.NEXTAUTH_URL || process.env.SITE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Задайте NEXTAUTH_URL=https://ваш-домен.ru в .env');
  process.exit(1);
}

function toFilesUrl(oldUrl) {
  if (!oldUrl || !oldUrl.includes('storage.yandexcloud.net')) return null;
  try {
    const u = new URL(oldUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const bucket = process.env.S3_BUCKET_NAME || 'krimvk';
    const key = parts[0] === bucket ? parts.slice(1).join('/') : parts.join('/');
    if (!key) return null;
    const path = '/files/' + key.split('/').map(encodeURIComponent).join('/');
    return base + path;
  } catch {
    return null;
  }
}

const prisma = new PrismaClient();

(async () => {
  let n = 0;
  for (const doc of await prisma.disclosureDocument.findMany()) {
    const next = toFilesUrl(doc.fileUrl);
    if (next && next !== doc.fileUrl) {
      await prisma.disclosureDocument.update({ where: { id: doc.id }, data: { fileUrl: next } });
      n++;
    }
  }
  console.log('disclosureDocument:', n, 'updated');

  n = 0;
  try {
    for (const doc of await prisma.waterQualityDocument.findMany()) {
      const next = toFilesUrl(doc.fileUrl);
      if (next && next !== doc.fileUrl) {
        await prisma.waterQualityDocument.update({ where: { id: doc.id }, data: { fileUrl: next } });
        n++;
      }
    }
    console.log('waterQualityDocument:', n, 'updated');
  } catch (e) {
    console.log('waterQualityDocument: skip', e.message);
  }

  await prisma.$disconnect();
  console.log('OK. Базовый URL:', base);
})();
