import { randomUUID } from "crypto";

type DirectAccountSession = {
  token: string;
  userId: string;
  accountNumber: string;
  password: string;
  region: string;
  expiresAt: number;
};

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const directAccountSessions = new Map<string, DirectAccountSession>();

function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of directAccountSessions.entries()) {
    if (session.expiresAt <= now) {
      directAccountSessions.delete(token);
    }
  }
}

export function createDirectAccountSession(
  userId: string,
  accountNumber: string,
  password: string,
  region: string
): string {
  cleanupExpiredSessions();

  const token = randomUUID();
  directAccountSessions.set(token, {
    token,
    userId,
    accountNumber,
    password,
    region,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export function getDirectAccountSession(
  token: string,
  userId: string
): Pick<DirectAccountSession, "accountNumber" | "password" | "region"> | null {
  cleanupExpiredSessions();
  const session = directAccountSessions.get(token);
  if (!session) return null;
  if (session.userId !== userId) return null;
  if (session.expiresAt <= Date.now()) {
    directAccountSessions.delete(token);
    return null;
  }
  return {
    accountNumber: session.accountNumber,
    password: session.password,
    region: session.region,
  };
}

export function dropDirectAccountSession(token: string): void {
  directAccountSessions.delete(token);
}
