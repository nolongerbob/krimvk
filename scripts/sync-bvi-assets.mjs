#!/usr/bin/env node
/**
 * Копирует dist пакета bvi (veks) в public/bvi для Next.js.
 */
import { cpSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDist = join(root, 'node_modules', 'bvi', 'dist');
const publicBvi = join(root, 'public', 'bvi');

if (!existsSync(pkgDist)) {
  console.warn('[sync-bvi-assets] Пакет bvi не установлен — пропуск');
  process.exit(0);
}

mkdirSync(join(publicBvi, 'css'), { recursive: true });
mkdirSync(join(publicBvi, 'js'), { recursive: true });

cpSync(join(pkgDist, 'css', 'bvi.min.css'), join(publicBvi, 'css', 'bvi.min.css'));
cpSync(join(pkgDist, 'js', 'bvi.min.js'), join(publicBvi, 'js', 'bvi.min.js'));

console.log('[sync-bvi-assets] public/bvi/css и public/bvi/js обновлены');
