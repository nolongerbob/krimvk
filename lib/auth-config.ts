import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "./auth";
import { prisma } from "./prisma";

// Функция для создания кастомного OAuth провайдера Госуслуг
function createGosuslugiProvider() {
  return {
    id: "gosuslugi",
    name: "Госуслуги",
    type: "oauth",
    authorization: {
      url: process.env.GOSUSLUGI_AUTHORIZATION_URL || "https://esia.gosuslugi.ru/aas/oauth2/ac",
      params: {
        scope: "openid profile email",
        response_type: "code",
        access_type: "online",
      },
    },
    token: {
      url: process.env.GOSUSLUGI_TOKEN_URL || "https://esia.gosuslugi.ru/aas/oauth2/te",
    },
    userinfo: {
      url: process.env.GOSUSLUGI_USERINFO_URL || "https://esia.gosuslugi.ru/rs/prns",
    },
    clientId: process.env.GOSUSLUGI_CLIENT_ID,
    clientSecret: process.env.GOSUSLUGI_CLIENT_SECRET,
    profile(profile: any) {
      return {
        id: profile.sub || profile.id || profile.snils,
        email: profile.email,
        name: profile.name || `${profile.lastName || ""} ${profile.firstName || ""} ${profile.middleName || ""}`.trim() || profile.email,
      };
    },
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
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
    // Добавляем провайдер Госуслуг только если настроены credentials
    ...(process.env.GOSUSLUGI_CLIENT_ID && process.env.GOSUSLUGI_CLIENT_SECRET
      ? [createGosuslugiProvider() as any]
      : []),
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
    async signIn({ user, account, profile }) {
      // Обработка входа через Госуслуги
      if (account?.provider === "gosuslugi") {
        try {
          // Проверяем, существует ли пользователь с таким email
          const existingUser = await getUserByEmail(user.email || "");
          
          if (!existingUser) {
            // Создаем нового пользователя, если его нет
            const newUser = await prisma.user.create({
              data: {
                email: user.email || "",
                name: user.name || "",
                password: "", // OAuth пользователи не имеют пароля
                role: "USER",
              },
            });
            
            // Создаем связь с OAuth аккаунтом
            if (account) {
              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          } else {
            // Пользователь существует, проверяем связь с OAuth аккаунтом
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            });
            
            if (!existingAccount) {
              // Создаем связь, если её нет
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Error in signIn callback:", error);
          }
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        if (process.env.NODE_ENV === 'development') {
          console.log('JWT token updated with role:', user.role);
        }
      }
      
      // Обновляем токен при обновлении OAuth токена
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        if (process.env.NODE_ENV === 'development') {
          console.log('Session callback - role set to:', token.role);
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

