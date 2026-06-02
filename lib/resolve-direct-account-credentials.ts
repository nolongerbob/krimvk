import { getDirectAccountSession } from '@/lib/direct-account-session';

export type DirectAccountCredentials = {
  accountNumber: string;
  password: string;
  region: string;
};

type ResolveResult =
  | { ok: true; credentials: DirectAccountCredentials }
  | { ok: false; error: string; status: number };

/**
 * Учётные данные 1С для «прямого л/с» — только из серверной сессии по token (не из URL).
 */
export function resolveDirectAccountCredentials(
  token: string | null | undefined,
  adminUserId: string
): ResolveResult {
  const trimmed = token?.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Укажите token сессии (подключитесь к л/с заново)',
      status: 400,
    };
  }

  const sessionCtx = getDirectAccountSession(trimmed, adminUserId);
  if (!sessionCtx) {
    return {
      ok: false,
      error: 'Сессия прямого доступа истекла. Подключитесь заново.',
      status: 401,
    };
  }

  return { ok: true, credentials: sessionCtx };
}
