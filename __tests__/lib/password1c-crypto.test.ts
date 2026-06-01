import {
  decryptPassword1c,
  encryptPassword1c,
  isEncryptedPassword1c,
} from '@/lib/password1c-crypto';

describe('password1c-crypto', () => {
  const prev = process.env.PASSWORD1C_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.PASSWORD1C_ENCRYPTION_KEY = 'test-key-for-unit-tests-only!!';
  });

  afterAll(() => {
    process.env.PASSWORD1C_ENCRYPTION_KEY = prev;
  });

  it('round-trips plaintext', () => {
    const enc = encryptPassword1c('secret-pass');
    expect(isEncryptedPassword1c(enc)).toBe(true);
    expect(decryptPassword1c(enc)).toBe('secret-pass');
  });

  it('leaves legacy plain values readable', () => {
    expect(decryptPassword1c('plain-old')).toBe('plain-old');
  });
});
