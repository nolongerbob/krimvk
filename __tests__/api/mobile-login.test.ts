import { loginWithCredentials } from '@/lib/credentials-login';
import { getUserByEmail, verifyPassword } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  getUserByEmail: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock('@/lib/next-auth-session-cookie', () => ({
  encodeNextAuthSessionToken: jest.fn().mockResolvedValue('mock-jwt-token'),
}));

describe('loginWithCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user not found', async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    const result = await loginWithCredentials('a@b.ru', 'pass');
    expect(result).toEqual({
      ok: false,
      error: 'Неверный email или пароль',
      status: 401,
    });
  });

  it('returns token when password valid', async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.ru',
      name: 'Test',
      role: 'USER',
      password: 'hash',
    });
    (verifyPassword as jest.Mock).mockResolvedValue(true);

    const result = await loginWithCredentials('a@b.ru', 'pass');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('u1');
    }
  });
});
