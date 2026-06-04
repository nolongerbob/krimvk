#!/usr/bin/env node
/**
 * Копирует dist пакета bvi (veks) в public/bvi для Next.js.
 * Патч: location.host → location.hostname в cookie (иначе на :3000 cookie не ставятся).
 */
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
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

const jsPath = join(publicBvi, 'js', 'bvi.min.js');
let js = readFileSync(jsPath, 'utf8');
const original = js;

let patched = js.replaceAll('location.host', 'location.hostname');
if (patched !== js) {
  console.log('[sync-bvi-assets] cookie domain: location.host → location.hostname');
  js = patched;
}

patched = js.replaceAll(
  '"Microsoft Pavel - Russian (Russia)"===u[a].name',
  '(u[a].lang.indexOf("ru")===0||u[a].name.indexOf("Russian")>=0)'
);
patched = patched.replaceAll(
  '"Microsoft Pavel - English (English)"===u[a].name',
  '(u[a].lang.indexOf("en")===0||u[a].name.indexOf("English")>=0)'
);
if (patched !== js) {
  console.log('[sync-bvi-assets] speech: голос не только Microsoft Pavel');
  js = patched;
}

if (js !== original) {
  writeFileSync(jsPath, js);
}

console.log('[sync-bvi-assets] public/bvi/css и public/bvi/js обновлены');
