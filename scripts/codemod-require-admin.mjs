#!/usr/bin/env node
/**
 * Заменяет типовую проверку session + prisma role ADMIN на requireAdmin().
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminApi = path.join(root, 'app/api/admin');

const patterns = [
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session(?:\s*\|\|\s*!session\.user(?:\s*\|\|\s*!session\.user\.id)?)?\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*const user = await prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true(?:, email: true)? \},\s*\n\s*\}\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*const user = await withRetry\(\(\) =>\s*\n\s*prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\)\s*\n\s*\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getSession\(\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*const user = await prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*\/\/ Проверяем, что пользователь - администратор\s*\n\s*const user = await prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*\/\/ Проверяем, что пользователь - администратор\s*\n\s*const user = await withRetry\(\(\) =>\s*\n\s*prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\)\s*\n\s*\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session \|\| !session\.user \|\| !session\.user\.id\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*\/\/ Проверяем, что пользователь - админ\s*\n\s*const user = await prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\);\s*\n\s*if \(user\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 403 \}\);\s*\n\s*\}/g,
  /const session = await getServerSession\(authOptions\);\s*\n\s*if \(!session\?\.user\?\.id\) \{\s*\n\s*return NextResponse\.json\(\{ error: "[^"]+" \}, \{ status: 401 \}\);\s*\n\s*\}\s*\n\s*\/\/ Проверяем, что текущий пользователь - админ\s*\n\s*const currentUser = await withRetry\(\(\) =>\s*\n\s*prisma\.user\.findUnique\(\{\s*\n\s*where: \{ id: session\.user\.id \},\s*\n\s*select: \{ role: true \},\s*\n\s*\}\)\s*\n\s*\);\s*\n\s*if \(currentUser\?\.role !== "ADMIN"\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ error: "[^"]+" \},\s*\n\s*\{ status: 403 \}\s*\n\s*\);\s*\n\s*\}/g,
];

const replacement = `const auth = await requireAdmin();
    if (!auth.ok) return auth.response`;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.ts')) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(adminApi)) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('role !== "ADMIN"')) continue;
  if (src.includes('requireAdmin')) continue;

  let next = src;
  for (const re of patterns) {
    next = next.replace(re, replacement);
  }
  if (next === src) continue;

  if (!next.includes('requireAdmin')) {
    console.warn('skip (pattern mismatch):', path.relative(root, file));
    continue;
  }

  if (!/from ["']@\/lib\/require-admin["']/.test(next)) {
    next = next.replace(
      /^(import .+ from ["']@\/lib\/auth-config["'];?\n)/m,
      `$1import { requireAdmin } from "@/lib/require-admin";\n`
    );
    next = next.replace(
      /^(import .+ from ["']@\/lib\/get-session["'];?\n)/m,
      `$1import { requireAdmin } from "@/lib/require-admin";\n`
    );
    if (!next.includes('requireAdmin')) {
      next = `import { requireAdmin } from "@/lib/require-admin";\n${next}`;
    }
  }

  // drop unused prisma import if only used for role check - too risky, leave prisma

  fs.writeFileSync(file, next);
  changed++;
  console.log('updated:', path.relative(root, file));
}

console.log(`done: ${changed} files`);
