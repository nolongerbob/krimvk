#!/usr/bin/env bash
# Prepare an immutable release. Never mutate the active checkout, DB, PM2 or Nginx.
set -Eeuo pipefail
umask 077

die() { echo "Release preparation stopped: $*" >&2; exit 1; }
if [[ "${1:-}" != "--prepare" ]]; then
  echo 'Usage: RELEASE_REF=<commit> RELEASES_DIR=<absolute directory> RELEASE_ENV_FILE=<absolute env file> METER_SUBMISSION_DIR=<existing journal> bash scripts/deploy-vps.sh --prepare' >&2
  echo 'Preparation only. Migration and traffic switching require a separate approved release window.' >&2
  exit 2
fi
for tool in git node npm tar mktemp; do command -v "$tool" >/dev/null || die "Missing $tool"; done
[[ "$(id -u)" != 0 ]] || die 'Run as the application user, not root'
SOURCE_DIR="$(git rev-parse --show-toplevel)"
# A git archive silently omits unstaged and untracked work. Do not label an old
# commit as the release that was just reviewed in a dirty working directory.
[[ -z "$(git -C "$SOURCE_DIR" status --porcelain --untracked-files=normal)" ]] || die 'Working tree is not clean; review and commit the release files or use a clean checkout of RELEASE_REF'
[[ -n "${RELEASE_REF:-}" && "$RELEASE_REF" != -* ]] || die 'RELEASE_REF is required'
COMMIT="$(git -C "$SOURCE_DIR" rev-parse --verify "${RELEASE_REF}^{commit}")"
[[ -n "${RELEASES_DIR:-}" && "$RELEASES_DIR" = /* && "$RELEASES_DIR" != / ]] || die 'Set an absolute RELEASES_DIR'
[[ -n "${RELEASE_ENV_FILE:-}" && "$RELEASE_ENV_FILE" = /* && -f "$RELEASE_ENV_FILE" && -r "$RELEASE_ENV_FILE" ]] || die 'Set an existing absolute RELEASE_ENV_FILE'
[[ -n "${METER_SUBMISSION_DIR:-}" && "$METER_SUBMISSION_DIR" = /* && -d "$METER_SUBMISSION_DIR" && -w "$METER_SUBMISSION_DIR" ]] || die 'Set the existing writable absolute METER_SUBMISSION_DIR; never create an empty replacement'
METER_SUBMISSION_DIR="$(cd "$METER_SUBMISSION_DIR" && pwd -P)"
RELEASE_ENV_FILE="$(node -e 'console.log(require("fs").realpathSync(process.argv[1]))' "$RELEASE_ENV_FILE")"
mkdir -p "$RELEASES_DIR"
RELEASES_DIR="$(cd "$RELEASES_DIR" && pwd -P)"
[[ "$RELEASES_DIR" != / ]] || die 'Release storage cannot resolve to filesystem root'
[[ "$RELEASES_DIR" != "$SOURCE_DIR" && "$RELEASES_DIR" != "$SOURCE_DIR/"* ]] || die 'Release storage must be outside the active checkout'
[[ "$METER_SUBMISSION_DIR" != "$RELEASES_DIR" && "$METER_SUBMISSION_DIR" != "$RELEASES_DIR/"* ]] || die 'Meter journal must be outside disposable releases'
[[ "$RELEASE_ENV_FILE" != "$RELEASES_DIR/"* ]] || die 'Environment file must live outside disposable releases'
# Archive only committed files, never unreviewed worktree changes or local secrets.
if git -C "$SOURCE_DIR" ls-tree -r --name-only "$COMMIT" | grep -E '(^|/)\.env($|\.)|^\.local-dev/|^\.meter-submissions/' | grep -Ev '(^|/)\.env\.example($|\.)' >/dev/null; then
  die 'Release contains private environment/state files'
fi
RELEASE_DIR="$(mktemp -d "$RELEASES_DIR/release-${COMMIT:0:12}.XXXXXX")"
trap 'echo "Preparation failed; active release unchanged. Inspect retained directory: $RELEASE_DIR" >&2' ERR
git -C "$SOURCE_DIR" archive "$COMMIT" | tar -x -C "$RELEASE_DIR"
[[ -f "$RELEASE_DIR/package-lock.json" ]] || die 'Release must have package-lock.json'
ln -s "$RELEASE_ENV_FILE" "$RELEASE_DIR/.env.production.local"
export NODE_ENV=production METER_SUBMISSION_DIR
cd "$RELEASE_DIR"
npm ci --include=dev
npm audit --omit=dev --audit-level=high
./node_modules/.bin/prisma generate
./node_modules/.bin/tsc --noEmit
NODE_ENV=test ./node_modules/.bin/jest --runInBand
npm run build
# Prisma CLI does not load .env.production.local. Use the same env as Next.
# Pending or failed migrations STOP preparation; no automatic schema changes.
node --input-type=commonjs - <<'JS'
const {spawnSync} = require('node:child_process');
require('@next/env').loadEnvConfig(process.cwd(), false);
const result = spawnSync('./node_modules/.bin/prisma', ['migrate', 'status'], {stdio: 'inherit', env: process.env});
process.exit(result.status ?? 1);
JS
node --input-type=commonjs - "$COMMIT" <<'JS'
const fs = require('node:fs');
fs.writeFileSync('release-manifest.json', JSON.stringify({commit: process.argv[2], preparedAt: new Date().toISOString(), meterSubmissionDir: process.env.METER_SUBMISSION_DIR}, null, 2), {mode: 0o600});
JS
echo "Prepared release: $RELEASE_DIR"
echo 'NOT deployed. Start a loopback-only candidate, verify DB health and UI, then explicitly switch Nginx. Keep the old process for rollback.'
