import { NextResponse } from 'next/server';
import type { AdminAuth } from '@/lib/require-admin';
import { resolveDirectAccountCredentials } from '@/lib/resolve-direct-account-credentials';

type CredentialsResult =
  | { ok: true; credentials: import('@/lib/resolve-direct-account-credentials').DirectAccountCredentials }
  | { ok: false; response: NextResponse };

export function directAccountCredentialsFromToken(
  token: string | null,
  admin: AdminAuth
): CredentialsResult {
  const resolved = resolveDirectAccountCredentials(token, admin.userId);
  if (!resolved.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: resolved.error }, { status: resolved.status }),
    };
  }
  return { ok: true, credentials: resolved.credentials };
}
