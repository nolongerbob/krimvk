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
  // Увеличиваем timeout для пула соединений в локальной разработке
  // ...(process.env.NODE_ENV === 'development' && {
  //   __internal: {
  //     engine: {
  //       connectTimeout: 30000, // 30 секунд вместо 10
  //     },
  //   },
  // }),
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
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      
      // Обрабатываем различные типы ошибок подключения
      const isConnectionError = 
        errorCode === 'P1001' || // Connection error
        errorCode === 'P1017' || // Server has closed the connection
        errorCode === 'P2024' || // Connection pool timeout
        errorMessage.includes('Server has closed the connection') ||
        errorMessage.includes('Connection closed') ||
        errorMessage.includes('Timed out fetching a new connection');
      
      if (isConnectionError && i < retries - 1) {
        // Переподключаемся
        try {
          await prisma.$disconnect();
          // Небольшая задержка перед переподключением
          await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
          await prisma.$connect();
        } catch (connectError) {
          console.error('Failed to reconnect:', connectError);
        }
        // Ждем перед повторной попыткой
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}






