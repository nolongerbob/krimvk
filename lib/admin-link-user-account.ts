import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
import { ALLOWED_1C_REGIONS } from '@/lib/1c-regions';
import { normalize1CResponse, is1CAccountPayload } from '@/lib/normalize-1c-response';
import { parseMeterNumber } from '@/lib/parse-meter-number';
import { encryptPassword1c } from '@/lib/password1c-crypto';
import { AdminUserError } from '@/lib/admin-user-management';
import { adminUserSelect } from '@/lib/admin-user-details';
import { invalidateUserBalance } from '@/lib/admin-users-index';
import { syncUtilityAccountEmail } from '@/lib/utility-account-email';

const inputSchema = z.object({
  accountNumber: z.string().trim().regex(/^\d{1,20}$/, 'Введите номер лицевого счёта: только цифры'),
  password1c: z.string().trim().min(1, 'Укажите пароль лицевого счёта').max(256),
  region: z.string().refine(value => ALLOWED_1C_REGIONS.some(region => region === value), 'Выберите район из списка'),
}).strict();
const textValue = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() || null;
function duplicateError(ownerId: string, userId: string) {
  return new AdminUserError(ownerId === userId ? 'Этот лицевой счёт уже добавлен пользователю.' : 'Этот лицевой счёт привязан к другому пользователю. Автоматический перенос запрещён.', 409);
}

/** Reads 1C with supplied credentials; creates only the selected website user's association. */
export async function linkAdminUserAccount(actorId: string, userId: string, input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new AdminUserError(parsed.error.issues[0]?.message || 'Некорректные данные', 400);
  const { accountNumber, password1c, region } = parsed.data;
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (actor?.role !== 'ADMIN') throw new AdminUserError('Доступ запрещён', 403);
  if (!await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) throw new AdminUserError('Пользователь не найден', 404);
  const existing = await prisma.userAccount.findUnique({ where: { accountNumber }, select: { userId: true } });
  if (existing) throw duplicateError(existing.userId, userId);

  // Fail before contacting 1C if encryption isn't configured. Never persist plaintext.
  if (!process.env.PASSWORD1C_ENCRYPTION_KEY?.trim()) throw new AdminUserError('Не настроено безопасное хранение паролей 1С. Обратитесь к администратору сервера.', 503);
  const encrypted = encryptPassword1c(password1c);
  const credentialCheckStartedAt = new Date();
  let data: Record<string, unknown>;
  try {
    data = normalize1CResponse(await get1CUserData(accountNumber, password1c, region, undefined, undefined, { bypassCache: true }));
    if (!is1CAccountPayload(data)) throw new Error('INVALID_PAYLOAD');
  } catch (error) {
    // Do not return or log upstream bodies/URLs: they may contain credentials.
    const message = error instanceof Error ? error.message : '';
    if (/AUTH_ERROR|\b401\b|\b403\b/.test(message)) throw new AdminUserError('Неверный номер лицевого счёта или пароль 1С.', 400);
    throw new AdminUserError('Не удалось проверить данные в 1С. Счёт не добавлен — попробуйте позже.', 503);
  }
  if (data.LSCode != null && String(data.LSCode).trim() !== accountNumber) throw new AdminUserError('1С вернула другой лицевой счёт. Привязка отменена.', 502);
  const address = textValue(data.Address, data.address, data.Адрес, data.AddressFull, data.FullAddress) || 'Адрес не указан';
  const name = textValue(data.LSName, data.Name, data.name, data.ФИО, data.Description, data.FullName, data.FIO);
  const phone = textValue(data.Phone, data.phone, data.Телефон, data.PhoneNumber);
  const rawMeters = data.MeteringDevices || data.Devices || data.meters || data.Счетчики || data.DevicesList || [];
  const meters = (Array.isArray(rawMeters) ? rawMeters : []).filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === 'object');
  const meterRows = meters.map((meter, index) => {
    const serialNumber = textValue(meter.SerialNumber, meter.Number, meter.DeviceNumber, meter.Номер) || (typeof meter.Number === 'number' ? String(meter.Number) : `Счетчик-${index + 1}`);
    const service = textValue(meter.ServiceName, meter.Услуга) || '';
    const reading = parseMeterNumber(meter.LastReading);
    return { userId, serialNumber, address, type: service.toLowerCase().includes('горяч') ? 'горячая' : 'холодная', lastReading: Number.isFinite(reading) ? reading : null };
  });
  // Repeated meter entries in a 1C response must not create duplicate meters.
  const uniqueMeters = Array.from(new Map(meterRows.map(meter => [meter.serialNumber, meter])).values());
  let account;
  try {
    account = await prisma.$transaction(async tx => {
      const key = `${region}:${accountNumber}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
      await tx.$queryRaw`SELECT id FROM users WHERE id IN (${actorId}, ${userId}) ORDER BY id FOR UPDATE`;
      // A cached admin session or a deleted recipient cannot authorize this write.
      const currentActor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true } });
      if (currentActor?.role !== 'ADMIN') throw new AdminUserError('Доступ запрещён', 403);
      if (!await tx.user.findUnique({ where: { id: userId }, select: { id: true } })) throw new AdminUserError('Пользователь не найден', 404);
      const linked = await tx.userAccount.findUnique({ where: { accountNumber }, select: { userId: true } });
      if (linked) throw duplicateError(linked.userId, userId);
      if (region === 'saki') {
        const access = await tx.utilityAccountAccess.findUnique({ where: { key } });
        const changed = await tx.utilityPasswordChange.findFirst({ where: { accountKey: key, status: 'COMPLETED', completedAt: { gte: credentialCheckStartedAt } }, select: { id: true } });
        if (access?.pendingChangeId || changed) throw new AdminUserError('Пароль счёта меняется или только что изменён. Повторите привязку с новым паролем.', 409);
      }
      return tx.userAccount.create({
        data: { userId, accountNumber, password1c: encrypted, region, address, name, phone, meters: { create: uniqueMeters } },
        select: adminUserSelect.userAccounts.select,
      });
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') throw new AdminUserError('Лицевой счёт уже привязан. Обновите профиль пользователя.', 409);
    throw error;
  }
  invalidateUserBalance(userId);
  console.info('[admin-account-link]', { actorId, userId, accountId: account.id });
  let emailSyncPending = false;
  if (region === 'saki') {
    try { emailSyncPending = await syncUtilityAccountEmail(userId, accountNumber, region) !== 'synced'; }
    catch { emailSyncPending = true; }
  }
  return { account, emailSyncPending };
}
