/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/auto-login/route';
import {
  createPostVerifyLoginToken,
  verifyPostVerifyLoginToken,
} from '@/lib/post-verify-login-token';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next-auth/jwt', () => ({
  encode: jest.fn().mockResolvedValue('mock-jwt-session'),
}));

describe('POST /api/auth/auto-login', () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-jest-only';
  });

  afterAll(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function post(body: unknown) {
    return POST(
      new NextRequest('http://localhost/api/auth/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
  }

  it('rejects login with userId (old insecure API)', async () => {
    const res = await post({ userId: 'any-user-id' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/токен/i);
  });

  it('rejects missing loginToken', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });

  it('rejects invalid loginToken', async () => {
    const res = await post({ loginToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });

  it('rejects when email is not verified', async () => {
    const { prisma } = require('@/lib/prisma');
    const userId = 'user-unverified';
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'u@test.ru',
      name: 'Test',
      role: 'USER',
      emailVerified: null,
    });

    const loginToken = createPostVerifyLoginToken(userId);
    const res = await post({ loginToken });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/не подтвержден/i);
  });

  it('sets session cookie for valid loginToken and verified email', async () => {
    const { prisma } = require('@/lib/prisma');
    const userId = 'user-verified-1';
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'ok@test.ru',
      name: 'Ok User',
      role: 'USER',
      emailVerified: new Date(),
    });

    const loginToken = createPostVerifyLoginToken(userId);
    expect(verifyPostVerifyLoginToken(loginToken)?.userId).toBe(userId);

    const res = await post({ loginToken });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe('ok@test.ru');
    expect(data.user).not.toHaveProperty('id');

    const cookie = res.cookies.get('next-auth.session-token');
    expect(cookie?.value).toBe('mock-jwt-session');
    expect(cookie?.httpOnly).toBe(true);
  });

  it('returns 404 for unknown user in token', async () => {
    const { prisma } = require('@/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(null);

    const loginToken = createPostVerifyLoginToken('missing-user');
    const res = await post({ loginToken });
    expect(res.status).toBe(404);
  });
});
