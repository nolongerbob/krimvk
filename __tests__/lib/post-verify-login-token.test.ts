/**
 * @jest-environment node
 */
import {
  createPostVerifyLoginToken,
  verifyPostVerifyLoginToken,
} from '@/lib/post-verify-login-token';

describe('post-verify-login-token', () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-jest-only';
  });

  afterAll(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it('creates a token that verifies to the same userId', () => {
    const token = createPostVerifyLoginToken('user-abc-123');
    expect(verifyPostVerifyLoginToken(token)).toEqual({ userId: 'user-abc-123' });
  });

  it('rejects tampered signature', () => {
    const token = createPostVerifyLoginToken('user-1');
    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifyPostVerifyLoginToken(tampered)).toBeNull();
  });

  it('rejects token with wrong purpose in payload', () => {
    const token = createPostVerifyLoginToken('user-1');
    const [body, sig] = token.split('.');
    const payload = Buffer.from(body, 'base64url').toString('utf8');
    const evil = `evil:${payload.split(':').slice(1).join(':')}`;
    const evilBody = Buffer.from(evil, 'utf8').toString('base64url');
    expect(verifyPostVerifyLoginToken(`${evilBody}.${sig}`)).toBeNull();
  });

  it('rejects expired token', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const token = createPostVerifyLoginToken('user-expired');
    jest.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);

    expect(verifyPostVerifyLoginToken(token)).toBeNull();
    jest.restoreAllMocks();
  });

  it('rejects empty and malformed tokens', () => {
    expect(verifyPostVerifyLoginToken('')).toBeNull();
    expect(verifyPostVerifyLoginToken('no-dot')).toBeNull();
    expect(verifyPostVerifyLoginToken('.onlysig')).toBeNull();
  });
});
