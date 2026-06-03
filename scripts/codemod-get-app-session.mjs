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

const files = listApiRoutes('app/api').filter((f) =>
  fs.readFileSync(f, 'utf8').includes('getServerSession(authOptions)')
);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const paramMatch = content.match(
    /export async function (?:GET|POST|PUT|PATCH|DELETE)\([^,]*,\s*\{ params \}[^)]*\)|export async function (?:GET|POST|PUT|PATCH|DELETE)\(\s*(\w+):/
  );
  const reqName =
    content.match(/export async function \w+\(\s*(\w+): NextRequest/)?.[1] || 'request';

  if (!content.includes('getAppSession')) {
    content = content.replace(
      /import \{ getServerSession \} from ["']next-auth["'];\s*\nimport \{ authOptions \} from ["']@\/lib\/auth-config["'];\s*\n/g,
      'import { getAppSession } from "@/lib/get-app-session";\n'
    );
  }

  content = content.replace(
    /await getServerSession\(authOptions\)/g,
    `await getAppSession(${reqName})`
  );

  fs.writeFileSync(file, content);
  console.log('updated', file, 'param', reqName);
}
