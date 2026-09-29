import 'server-only';
import { timingSafeEqual } from 'crypto';
import { get1cBaseUrl } from '@/lib/1c-api';
import { supportsUtilityAccess, utilityAccountNumber, utilityNewPassword, UtilityAccessError } from '@/lib/utility-access-policy';

export function assertUtilityWritesEnabled() {
  if (process.env.ONE_C_READ_ONLY === 'true') throw new UtilityAccessError('Подключение к 1С работает только на чтение. Изменение пароля и почты отключено.', 403, 'ONE_C_READ_ONLY');
  if (!process.env.PASSWORD1C_ENCRYPTION_KEY) throw new UtilityAccessError('Не настроено защищённое хранение паролей 1С.', 503);
  assertUtilityTransport();
}

// Separate rollout from ordinary 1C reads and meter submissions. These new
// endpoints accept just an account number: their upstream ACL/authentication
// must be verified by the operator before the production flag is enabled.
function assertUtilityTransport() {
  if (process.env.NODE_ENV === 'production' && process.env.ONE_C_UTILITY_ACCESS_ENABLED !== 'true')
    throw new UtilityAccessError('Управление паролями лицевых счетов ещё не включено на сервере.', 503, 'UTILITY_ACCESS_DISABLED');
  let url: URL;
  try { url = new URL(get1cBaseUrl()); }
  catch { throw new UtilityAccessError('Не настроено защищённое подключение к 1С.', 503, 'ONE_C_TRANSPORT'); }
  const localTest = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(localTest && url.protocol === 'http:')))
    throw new UtilityAccessError('Для управления паролями требуется HTTPS-подключение к 1С.', 503, 'ONE_C_TRANSPORT');
}

export function utilityWritesEnabled() {
  try { assertUtilityWritesEnabled(); return true; } catch { return false; }
}

async function callAccountMethod(method: string, accountNumber: string, region: string, params: Record<string, string> = {}) {
  if (!supportsUtilityAccess(region)) throw new UtilityAccessError('Эта функция доступна только для Сакского района.', 400, 'UNSUPPORTED_REGION');
  if (!utilityAccountNumber.safeParse(accountNumber).success) throw new UtilityAccessError('Некорректный лицевой счёт');
  // Also protect GetAccountPassword (including reconciliation), not only writes.
  assertUtilityTransport();
  const query = Object.entries({ WaLsCode: accountNumber, ...params }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  // Never log this URL, upstream bodies or fetch errors: they can contain passwords.
  try {
    const response = await fetch(`${get1cBaseUrl()}/${region}/hs/WebAccounts/${method}?${query}`, {
      method: 'GET', cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      if ([400, 401, 403, 404, 405].includes(response.status)) throw new UtilityAccessError('1С отклонила запрос. Проверьте лицевой счёт и доступность нового метода.', 400, 'ONE_C_REJECTED');
      throw new Error('upstream unavailable');
    }
    const text = await response.text();
    let data: unknown;
    try { data = text.trim() ? JSON.parse(text) : null; } catch { throw new Error('invalid response'); }
    if (data === false || (data && typeof data === 'object' && ('error' in data || 'Error' in data || ('success' in data && data.success === false)))) throw new UtilityAccessError('1С отклонила запрос. Проверьте лицевой счёт.', 400, 'ONE_C_REJECTED');
    return data;
  } catch (error) {
    if (error instanceof UtilityAccessError) throw error;
    throw new UtilityAccessError('Не удалось подтвердить результат операции в 1С. Повторите проверку результата, не создавайте новый пароль.', 503, 'ONE_C_RESULT_UNKNOWN');
  }
}

// Server-internal only. Never expose the existing password via a public/admin GET route.
export async function get1CAccountPassword(accountNumber: string, region: string) {
  const data = await callAccountMethod('GetAccountPassword', accountNumber, region);
  if (!data || typeof data !== 'object' || !('WaLsPass' in data) || typeof data.WaLsPass !== 'string' || !data.WaLsPass || data.WaLsPass.length > 256)
    throw new UtilityAccessError('1С не вернула пароль лицевого счёта.', 503, 'ONE_C_RESULT_UNKNOWN');
  return data.WaLsPass;
}

export async function reset1CAccountPassword(accountNumber: string, password: string, region: string) {
  assertUtilityWritesEnabled();
  if (!utilityNewPassword.safeParse(password).success) throw new UtilityAccessError('Некорректный новый пароль');
  await callAccountMethod('ResetAccountPassword', accountNumber, region, { WaNewPass: password });
}

export async function update1CAccountEmail(accountNumber: string, email: string, region: string) {
  assertUtilityWritesEnabled();
  await callAccountMethod('UpdateAccountEmail', accountNumber, region, { WaNewEMail: email });
}

export function samePassword(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
