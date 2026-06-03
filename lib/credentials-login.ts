import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { encodeNextAuthSessionToken } from '@/lib/next-auth-session-cookie';

export type CredentialsLoginResult =
  | {
      ok: true;
      token: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
      };
    }
  | { ok: false; error: string; status: 401 | 400 };

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<CredentialsLoginResult> {
  const user = await getUserByEmail(email);
  if (!user?.password) {
    return { ok: false, error: 'Неверный email или пароль', status: 401 };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { ok: false, error: 'Неверный email или пароль', status: 401 };
  }

  const token = await encodeNextAuthSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'USER',
  });

  return {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'USER',
    },
  };
}
