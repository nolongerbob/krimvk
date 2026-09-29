import { z } from 'zod';

// The new methods are deployed only in the saki 1C database.
export const UTILITY_ACCESS_REGION = 'saki';
export const supportsUtilityAccess = (region: string | null | undefined) => region === UTILITY_ACCESS_REGION;
export const utilityAccountNumber = z.string().trim().regex(/^\d{1,20}$/, 'Укажите номер лицевого счёта: только цифры');
export const utilityNewPassword = z.string().regex(/^[A-Za-z0-9!@#$%&*?_-]{8,32}$/, 'От 8 до 32 символов: латинские буквы, цифры или !@#$%&*?_-');
export class UtilityAccessError extends Error {
  constructor(message: string, public status = 400, public code = 'UTILITY_ACCESS_ERROR') { super(message); }
}
