import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Функция для безопасного выполнения запросов с переподключением
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (
        error?.code === 'P1001' ||
        error?.message?.includes('Server has closed the connection') ||
        error?.message?.includes('Connection closed')
      ) {
        if (i < retries - 1) {
          // Переподключаемся
          try {
            await prisma.$disconnect();
            await prisma.$connect();
          } catch (connectError) {
            console.error('Failed to reconnect:', connectError);
          }
          // Ждем перед повторной попыткой
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}






