// Loopback-only TLS endpoint; forwards solely to the existing local dev server.
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const httpProxy = require('next/dist/compiled/http-proxy');
const proxy = httpProxy.createProxyServer({ target: 'http://127.0.0.1:3006', ws: true, xfwd: true });
proxy.on('error', (_error, _request, response) => {
  if (response?.writeHead) { response.writeHead(502); response.end('Local dev server unavailable'); }
  else response?.destroy();
});
const server = https.createServer({
  key: readFileSync(new URL('../.local-dev/localhost-key.pem', import.meta.url)),
  cert: readFileSync(new URL('../.local-dev/localhost-cert.pem', import.meta.url)),
}, (req, res) => proxy.web(req, res));
server.on('upgrade', (req, socket, head) => proxy.ws(req, socket, head));
server.listen(3443, '127.0.0.1', () => console.log('Local HTTPS: https://localhost:3443 -> 127.0.0.1:3006'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { proxy.close(); server.close(); });
