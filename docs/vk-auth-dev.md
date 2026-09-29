# VK ID on isolated development

Run `scripts/dev-seasonal.mjs` with `--esia-preview --yandex-auth --with-db --vk-auth` (plus optional existing visual flags). This sets NEXTAUTH_URL to https://dev.krimvk.ru. Production stays disabled regardless of credentials. No schema migration needed.

The HTTPS server proxies over an SSH reverse tunnel to loopback port 3006. Nginx Basic Auth protects the entire dev site; access credentials are in ignored `.local-dev/tunnel-access.json`. Do not copy these to the repository or use production credentials. The computer and tunnel must stay running.

Provider console changes still require confirmation:
- VK application 54784646: domain dev.krimvk.ru and redirect https://dev.krimvk.ru/api/auth/callback/vk.
- Yandex: add https://dev.krimvk.ru/api/auth/callback/yandex to keep Yandex login available at the new dev origin.
- Keep existing production and localhost entries.

VK, OK and Mail select different VK ID entry methods but share the verified VK ID identity namespace (`Account.provider = vk`). The UI describes this as a shared link. No email matching, automatic registration, account merging or token persistence occurs.

POST /api/auth/vk-start enforces same-origin, rate limits, and password/session verification for linking. It stores a five-minute, encrypted HttpOnly/Secure/SameSite=Lax flow cookie and a one-use hashed state in VerificationToken. Callback validates state, atomically consumes it, checks the current linking session, exchanges code+PKCE+device_id server-side, and checks user_info against the token user_id. Linking writes only the external ID and local owner. Login uses only the existing linked local user/role and issues a NextAuth-compatible secure JWT cookie. Provider secrets are not needed by this public-client PKCE flow.

Manual tests remaining: each real provider consent/cancel flow, link then logout/login, rejection of another cabinet's identity, and session reload after returning to another tab. Do not describe live OAuth as verified based only on mocked endpoint tests. Госуслуги remains unavailable.

If the tunnel is unavailable, dev must fail closed; never point its upstream to production.
