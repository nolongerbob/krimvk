import fs from 'fs';

function listApiRoutes(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${ent.name}`;
    if (ent.isDirectory()) out.push(...listApiRoutes(p));
    else if (ent.name === 'route.ts') out.push(p);
  }
  return out;
}

for (const file of listApiRoutes('app/api')) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('getAppSession(')) continue;

  content = content.replace(
    /import \{ getServerSession \} from ["']next-auth[^"']*["'];\s*\n/g,
    ''
  );
  content = content.replace(
    /import \{ authOptions \} from ["']@\/lib\/auth-config["'];\s*\n/g,
    ''
  );

  if (!content.includes('@/lib/get-app-session')) {
    const firstImport = content.match(/^import .+;\s*\n/m);
    if (firstImport) {
      content = content.replace(
        firstImport[0],
        `${firstImport[0]}import { getAppSession } from "@/lib/get-app-session";\n`
      );
    }
  }

  fs.writeFileSync(file, content);
  console.log('fixed', file);
}
