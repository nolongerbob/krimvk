import crypto from 'crypto';

const PREFIX = 'enc1:';
const IV_LEN = 12;
const TAG_LEN = 16;

function resolveKey(): Buffer | null {
  const raw = process.env.PASSWORD1C_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  try {
    const fromB64 = Buffer.from(raw, 'base64');
    if (fromB64.length === 32) return fromB64;
  } catch {
    /* try hex */
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function isEncryptedPassword1c(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Сохранение в БД (AES-256-GCM). Без ключа в dev — plain text. */
export function encryptPassword1c(plaintext: string): string {
  if (!plaintext || isEncryptedPassword1c(plaintext)) {
    return plaintext;
  }

  const key = resolveKey();
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PASSWORD1C_ENCRYPTION_KEY is not set');
    }
    return plaintext;
  }

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, ciphertext]).toString('base64url');
  return `${PREFIX}${blob}`;
}

/** Чтение из БД: plain text (legacy) или enc1:… */
export function decryptPassword1c(
  stored: string | null | undefined
): string | null {
  if (!stored) return null;
  if (!isEncryptedPassword1c(stored)) return stored;

  const key = resolveKey();
  if (!key) {
    throw new Error(
      'PASSWORD1C_ENCRYPTION_KEY is required to decrypt stored 1C passwords'
    );
  }

  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64url');
  if (raw.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Invalid encrypted password1c payload');
  }

  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = raw.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

/** Без падения страницы/цикла при неверном ключе или битой записи. */
export function tryDecryptPassword1c(
  stored: string | null | undefined
): string | null {
  try {
    return decryptPassword1c(stored);
  } catch {
    return null;
  }
}
