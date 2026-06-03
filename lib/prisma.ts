import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Настройка connection string с параметрами для предотвращения закрытия соединений
const databaseUrl = process.env.DATABASE_URL || '';
// Параметры для стабильного подключения:
// - connection_limit: уменьшаем до 3 для меньшего количества idle соединений
// - pool_timeout: увеличиваем до 30 секунд
// - connect_timeout: таймаут подключения 30 секунд
// - statement_timeout: таймаут выполнения запроса 30 секунд
// - keepalive_idle: 30 секунд - отправлять keepalive каждые 30 секунд
// - keepalive_interval: 10 секунд - интервал между keepalive пакетами
// - keepalive_count: 3 - количество попыток перед закрытием
const urlWithParams = databaseUrl.includes('?') 
  ? `${databaseUrl}&connection_limit=3&pool_timeout=30&connect_timeout=30&statement_timeout=30000&keepalive_idle=30&keepalive_interval=10&keepalive_count=3`
  : `${databaseUrl}?connection_limit=3&pool_timeout=30&connect_timeout=30&statement_timeout=30000&keepalive_idle=30&keepalive_interval=10&keepalive_count=3`;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: urlWithParams,
    },
  },
  // Дополнительные настройки для стабильности
  errorFormat: 'minimal',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Функция для безопасного выполнения запросов с переподключением
function isConnectionError(error: { code?: string; message?: string }): boolean {
  const errorCode = error?.code;
  const errorMessage = error?.message || '';
  return (
    errorCode === 'P1001' ||
    errorCode === 'P1017' ||
    errorCode === 'P2024' ||
    errorMessage.includes('Server has closed the connection') ||
    errorMessage.includes('Connection closed') ||
    errorMessage.includes('Timed out fetching a new connection') ||
    errorMessage.includes('Error { kind: Closed')
  );
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 5
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (isConnectionError(error) && i < retries - 1) {
        console.log(`[withRetry] Ошибка подключения (попытка ${i + 1}/${retries}), переподключаюсь...`);
        
        try {
          // Принудительно закрываем все соединения
          await prisma.$disconnect().catch(() => {});
          
          // Ждем перед переподключением (экспоненциальная задержка)
          const delay = Math.min(2000 * Math.pow(2, i), 10000); // Максимум 10 секунд
          await new Promise((resolve) => setTimeout(resolve, delay));
          
          // Переподключаемся
          await prisma.$connect();
          console.log(`[withRetry] Переподключение успешно, повторяю запрос...`);
          
          // Ждем еще немного перед повторной попыткой
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        } catch (connectError: any) {
          console.error('[withRetry] Ошибка переподключения:', connectError?.message || connectError);
          // Если переподключение не удалось, пробуем еще раз с задержкой
          const delay = Math.min(2000 * Math.pow(2, i), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Если это не ошибка подключения или последняя попытка
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}






