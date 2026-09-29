import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import YandexProvider from 'next-auth/providers/yandex';
import { isYandexAuthEnabled } from './yandex-auth';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { consumeYandexLink, YANDEX_LINK_COOKIE } from './yandex-link';
import { createSocialDraft, SOCIAL_REG_COOKIE, socialCookieOptions } from './social-registration';
import { getUserByEmail, verifyPassword } from "./auth";
import { prisma } from "./prisma";
import { applyCanonicalSiteUrl } from "./site-url";

applyCanonicalSiteUrl();

export const authOptions: NextAuthOptions = {
  providers: [
    ...(isYandexAuthEnabled() ? [YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
      authorization: { url: 'https://oauth.yandex.ru/authorize', params: { scope: 'login:info login:email', force_confirm: 'yes' } },
      checks: ['state', 'pkce'],
    })] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          return null;
        }

        // Проверяем, есть ли пароль у пользователя (OAuth пользователи могут не иметь пароля)
        if (!user.password) {
          return null; // Пользователь зарегистрирован через OAuth, нельзя войти по паролю
        }

        // Разрешаем вход даже если email не подтвержден
        // Проверка подтверждения будет в личном кабинете

        const isValidPassword = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
    // ЕСИА is not a generic client-secret OAuth provider. Keep it disconnected
    // until the approved transport, signature verification and explicit linking
    // flow are implemented. Legacy environment variables must not activate it.
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === 'yandex') {
        if (!isYandexAuthEnabled() || !account.providerAccountId) return false;
        const jar = await cookies();
        const intent = jar.get(YANDEX_LINK_COOKIE)?.value;
        if (intent) {
          jar.delete(YANDEX_LINK_COOKIE);
          const cookieName = process.env.NEXTAUTH_URL?.startsWith('https:') ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
          const raw = jar.get(cookieName)?.value || jar.getAll().filter(c => c.name.startsWith(cookieName + '.'))
            .sort((a, b) => Number(a.name.split('.').pop()) - Number(b.name.split('.').pop())).map(c => c.value).join('');
          const current = raw ? await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET! }) : null;
          const id = typeof current?.id === 'string' ? current.id : current?.sub;
          if (!id) return '/login?error=YandexLinkExpired';
          try {
            const linked = await consumeYandexLink(intent, id, account.providerAccountId);
            return linked ? '/dashboard/settings?yandex=linked' : '/dashboard/settings?yandex=conflict';
          } catch { return '/dashboard/settings?yandex=conflict'; }
        }
        const linked = await prisma.account.findUnique({
          where: { provider_providerAccountId: { provider: 'yandex', providerAccountId: account.providerAccountId } },
          include: { user: true },
        });
        if (!linked) {
          // Never infer ownership from a provider email or create an implicit link.
          const sessionName = process.env.NEXTAUTH_URL?.startsWith('https:') ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
          const existingSession = jar.get(sessionName)?.value || jar.getAll().filter(c => c.name.startsWith(sessionName + '.')).map(c => c.value).join('');
          if (existingSession) return '/dashboard/settings?yandex=needs-link';
          const draft = await createSocialDraft('yandex', account.providerAccountId, { name: user.name, email: user.email });
          jar.set(SOCIAL_REG_COOKIE, draft, socialCookieOptions());
          return '/register?social=1';
        }
        user.id = linked.user.id;
        user.email = linked.user.email;
        user.name = linked.user.name;
        user.role = linked.user.role;
        return true;
      }
      // No automatic email-based linking. The approved ESIA adapter is pending.
      return account?.provider !== "gosuslugi";
    },
    async jwt({ token, user, account, trigger }) {
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('JWT callback called:', {
          hasToken: !!token,
          hasUser: !!user,
          hasAccount: !!account,
          trigger,
          tokenKeys: token ? Object.keys(token) : [],
          tokenId: token?.id,
          tokenSub: token?.sub,
        });
      }
      
      // Refresh profile fields from the database, never from client JWT data.
      if (trigger === 'update') {
        const userId = typeof token.id === 'string' ? token.id : token.sub;
        if (userId) {
          const profile = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });
          if (profile) {
            token.name = profile.name;
            token.email = profile.email;
          }
        }
      }

      // Если токен уже имеет id (создан вручную), используем его
      // Это нужно для токенов, созданных после подтверждения email
      if (token.id && !user) {
        // Токен уже имеет все необходимые данные, просто возвращаем его
        if (process.env.NODE_ENV === 'development') {
          console.log('JWT callback - token already has data (manual token):', {
            id: token.id,
            email: token.email,
            role: token.role,
          });
        }
        return token;
      }
      
      // Обычный процесс - обновляем токен при входе пользователя
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        if (process.env.NODE_ENV === 'development') {
          console.log('JWT token updated with user data:', {
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }
      }
      
      // Обновляем токен при обновлении OAuth токена
      if (account?.access_token && account.provider !== 'yandex') {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const userId = (token.id as string) || (token.sub as string);
        // JWTs from other tabs/devices outlive cookie deletion. Never authorize
        // a removed account, even while its token is cryptographically valid.
        if (!userId || !await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) {
          return null as unknown as typeof session;
        }
        session.user.id = (token.id as string) || (token.sub as string) || '';
        session.user.email = (token.email as string) || session.user.email || '';
        session.user.name = (token.name as string) ?? session.user.name ?? null;
        session.user.role = (token.role as string) || 'USER';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
