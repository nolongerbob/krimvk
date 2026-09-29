// Protected, temporary dev exposure. Never logs request bodies or credentials.
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
if (process.env.NODE_ENV === 'production') throw new Error('Dev only');
const access = JSON.parse(readFileSync(new URL('../.local-dev/tunnel-access.json', import.meta.url), 'utf8'));
if (!access.username || !access.password) throw new Error('Missing tunnel access password');
const child = spawn('/opt/homebrew/bin/ngrok', ['http', 'http://127.0.0.1:3006', '--inspect=false', '--basic-auth', `${access.username}:${access.password}`], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
