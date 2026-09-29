/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const script = path.join(process.cwd(), 'scripts/deploy-vps.sh');
const source = fs.readFileSync(script, 'utf8');

it('has valid bash syntax', () => {
  expect(spawnSync('bash', ['-n', script]).status).toBe(0);
});
it('fails closed for legacy invocations before touching a release', () => {
  const result = spawnSync('bash', [script], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('Preparation only');
});
it('never modifies the live checkout or automatically mutates the schema/traffic', () => {
  expect(source).not.toMatch(/git (?:checkout|reset)|prisma (?:db push|migrate deploy)|pm2 (?:reload|restart|delete)|systemctl reload|rm -rf/);
  expect(source).toContain('archive "$COMMIT"');
  expect(source).toContain("['migrate', 'status']");
});
it('requires a persistent existing journal outside disposable releases', () => {
  expect(source).toContain('-d "$METER_SUBMISSION_DIR"');
  expect(source).toContain('-w "$METER_SUBMISSION_DIR"');
  expect(source).toContain('Meter journal must be outside disposable releases');
  expect(source).toContain('export NODE_ENV=production METER_SUBMISSION_DIR');
});
it('makes CI preparation manual and reads the script from the selected commit', () => {
  const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/deploy.yml'), 'utf8');
  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).not.toMatch(/^\s+push:/m);
  expect(workflow).toContain('git archive "$RELEASE_REF" scripts/deploy-vps.sh');
  expect(workflow).toContain('--prepare');
});
it('does not silently discard dirty source files and checks runtime dependencies', () => {
  expect(source).toContain('status --porcelain --untracked-files=normal');
  expect(source).toContain('npm audit --omit=dev --audit-level=high');
});
it('keeps schema changes out of every build entry point', () => {
  const { scripts } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  for (const name of ['build', 'vercel-build', 'build:vps']) {
    expect(scripts[name]).not.toMatch(/db push|migrate deploy|apply-.*migration|accept-data-loss/);
  }
  const config = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
  expect(config).toContain('ignoreDuringBuilds: false');
});
