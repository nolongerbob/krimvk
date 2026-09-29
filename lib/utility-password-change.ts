import 'server-only';
import { randomInt } from 'crypto';
import type { Prisma, UtilityPasswordChange } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { encryptPassword1c, decryptPassword1c } from '@/lib/password1c-crypto';
import { assertUtilityWritesEnabled, reset1CAccountPassword, get1CAccountPassword, samePassword } from '@/lib/1c-account-access';
import { supportsUtilityAccess, utilityNewPassword, UtilityAccessError } from '@/lib/utility-access-policy';
import { recoveryHash, recoveryPrefix } from '@/lib/utility-password-recovery';
import { invalidateUserBalance } from '@/lib/admin-users-index';
import { syncUtilityAccountEmail } from '@/lib/utility-account-email';

export function generateUtilityPassword() {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789'];
  const alphabet = groups.join('');
  const chars = groups.map(group => group[randomInt(group.length)]);
  while (chars.length < 8) chars.push(alphabet[randomInt(alphabet.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

type ChangeInput = { requestId: string; actorId: string; accountNumber: string; region: string; checkOnly?: boolean } & (
  { questionId: string; password?: string; token?: never } |
  { questionId?: never; password?: string; token: string }
);

async function checkRecipient(tx: Prisma.TransactionClient, input: ChangeInput) {
  if (input.questionId) {
    const actor = await tx.user.findUnique({ where: { id: input.actorId }, select: { role: true } });
    if (actor?.role !== 'ADMIN') throw new UtilityAccessError('Доступ запрещён', 403);
    const question = await tx.question.findUnique({ where: { id: input.questionId }, select: { userId: true, status: true } });
    if (!question || question.status === 'COMPLETED') throw new UtilityAccessError('Выберите открытый диалог с получателем.', 409);
    return question.userId;
  }
  return input.actorId;
}

export async function changeUtilityPassword(input: ChangeInput) {
  assertUtilityWritesEnabled();
  if (!supportsUtilityAccess(input.region)) throw new UtilityAccessError('Смена пароля доступна только для Сакского района.');
  if (input.password !== undefined && !utilityNewPassword.safeParse(input.password).success) throw new UtilityAccessError('Некорректный новый пароль');
  if (!input.questionId && !input.checkOnly && !input.password) throw new UtilityAccessError('Укажите новый пароль');
  const key = `${input.region}:${input.accountNumber}`;
  const reserved = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    const userId = await checkRecipient(tx, input);
    const linked = await tx.userAccount.findFirst({ where: { accountNumber: input.accountNumber }, select: { userId: true, region: true } });
    if (linked && (linked.userId !== userId || linked.region !== input.region)) throw new UtilityAccessError('Этот лицевой счёт привязан к другому профилю или району. Пароль не изменён.', 409);
    const previous = await tx.utilityPasswordChange.findUnique({ where: { id: input.requestId } });
    if (previous) {
      if (previous.actorId !== input.actorId || previous.userId !== userId || previous.accountKey !== key || previous.questionId !== (input.questionId || null) || previous.recoveryTokenHash !== (input.token ? recoveryHash(input.token) : null)) throw new UtilityAccessError('Запрос не соответствует исходной операции.', 409);
      return { operation: previous, fresh: false };
    }
    if (input.checkOnly) throw new UtilityAccessError('Операция ещё не начиналась. Выполните генерацию снова.', 404, 'OPERATION_NOT_FOUND');
    const access = await tx.utilityAccountAccess.upsert({ where: { key }, create: { key }, update: {} });
    if (access.pendingChangeId) throw new UtilityAccessError('По этому счёту уже выполняется смена пароля. Сначала проверьте результат предыдущего запроса.', 409, 'PENDING_CHANGE');
    if (!input.questionId) {
      const digest = recoveryHash(input.token!);
      const pending = await tx.verificationToken.findUnique({ where: { token: digest } });
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
      const expected = recoveryPrefix(userId) + JSON.stringify({ accountNumber: input.accountNumber, region: input.region, email: user?.email.toLowerCase() });
      if (!user?.emailVerified || !pending || pending.expires <= new Date() || pending.identifier !== expected || access.userId !== userId || access.email !== user.email.toLowerCase() || !access.emailSyncedAt)
        throw new UtilityAccessError('Ссылка недействительна или устарела. Запросите новую из своего личного кабинета.', 400);
      const claimed = await tx.verificationToken.deleteMany({ where: { token: digest, expires: { gt: new Date() } } });
      if (claimed.count !== 1) throw new UtilityAccessError('Ссылка уже использована.', 409);
    }
    const password = input.password ?? generateUtilityPassword();
    const operation = await tx.utilityPasswordChange.create({ data: {
      id: input.requestId, accountKey: key, accountNumber: input.accountNumber, region: input.region,
      actorId: input.actorId, userId, questionId: input.questionId || null,
      recoveryTokenHash: input.token ? recoveryHash(input.token) : null, passwordEncrypted: encryptPassword1c(password),
    } });
    await tx.utilityAccountAccess.update({ where: { key }, data: { pendingChangeId: operation.id } });
    return { operation, fresh: true };
  });
  const operation = reserved.operation;
  if (operation.status === 'COMPLETED') return completedResult(operation);
  if (operation.status === 'FAILED') throw new UtilityAccessError('Предыдущий запрос отклонён 1С. Начните новую операцию.', 400, 'ONE_C_REJECTED');
  const password = decryptPassword1c(operation.passwordEncrypted);
  if (!password) throw new UtilityAccessError('Не удалось проверить сохранённую операцию.', 503);
  let rejected: UtilityAccessError | null = null;
  if (reserved.fresh) {
    // At most one write, even after timeout or reload. Subsequent calls only reconcile.
    try { await reset1CAccountPassword(operation.accountNumber, password, operation.region); }
    catch (error) { if (error instanceof UtilityAccessError && error.code === 'ONE_C_REJECTED') rejected = error; }
  }
  let confirmed = false;
  try { confirmed = samePassword(await get1CAccountPassword(operation.accountNumber, operation.region), password); } catch { /* unknown outcome: no message and no second reset */ }
  if (!confirmed && rejected) {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
      const latest = await tx.utilityPasswordChange.findUniqueOrThrow({ where: { id: operation.id } });
      if (latest.status === 'PENDING') {
        await tx.utilityPasswordChange.update({ where: { id: operation.id }, data: { status: 'FAILED', completedAt: new Date(), passwordEncrypted: '' } });
        await tx.utilityAccountAccess.update({ where: { key }, data: { pendingChangeId: null } });
      }
    });
    throw rejected;
  }
  if (!confirmed) throw new UtilityAccessError('1С пока не подтвердила смену пароля. Пароль в чат не отправлен. Нажмите «Проверить результат» — повторно менять пароль не будем.', 503, 'ONE_C_RESULT_UNKNOWN');

  const completed = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    const latest = await tx.utilityPasswordChange.findUniqueOrThrow({ where: { id: operation.id } });
    if (latest.status === 'COMPLETED') return latest;
    const user = await tx.user.findUnique({ where: { id: operation.userId }, select: { id: true } });
    if (!user) throw new UtilityAccessError('Профиль получателя удалён. Требуется проверка оператором.', 409);
    const linked = await tx.userAccount.findFirst({ where: { accountNumber: operation.accountNumber }, select: { userId: true, region: true } });
    if (linked && (linked.userId !== operation.userId || linked.region !== operation.region)) throw new UtilityAccessError('Привязка счёта изменилась. Требуется проверка оператором.', 409);
    await tx.userAccount.updateMany({ where: { accountNumber: operation.accountNumber, region: operation.region, userId: operation.userId }, data: { password1c: operation.passwordEncrypted } });
    let messageId: string | null = null;
    if (operation.questionId) {
      const question = await tx.question.findUnique({ where: { id: operation.questionId }, select: { userId: true } });
      if (question?.userId !== operation.userId) throw new UtilityAccessError('Диалог получателя недоступен.', 409);
      const message = await tx.message.create({ data: {
        questionId: operation.questionId, isFromAdmin: true, isSensitive: true, authorId: operation.actorId,
        text: `Новый пароль лицевого счёта № ${operation.accountNumber} (Сакский район): ${password}\nЭто пароль лицевого счёта 1С, не пароль от профиля сайта. Не передавайте его посторонним.`,
      } });
      messageId = message.id;
      await tx.question.update({ where: { id: operation.questionId }, data: { updatedAt: new Date(), status: 'IN_PROGRESS' } });
    }
    await tx.utilityAccountAccess.update({ where: { key }, data: { pendingChangeId: null } });
    await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: recoveryPrefix(operation.userId) } } });
    return tx.utilityPasswordChange.update({ where: { id: operation.id }, data: { status: 'COMPLETED', messageId, completedAt: new Date(), passwordEncrypted: '' } });
  });
  invalidateUserBalance(operation.userId);
  console.info('[utility-password-change]', { actorId: input.actorId, userId: operation.userId, operationId: operation.id });
  let emailWarning: string | undefined;
  try {
    const status = await syncUtilityAccountEmail(operation.userId, operation.accountNumber, operation.region, operation.id);
    if (status === 'unverified') emailWarning = 'Почта профиля не подтверждена: в 1С она не передана.';
  } catch { emailWarning = 'Пароль изменён, но почта пока не передана в 1С. Повторите синхронизацию почты отдельно.'; }
  return { ...await completedResult(completed), emailWarning };
}

async function completedResult(operation: UtilityPasswordChange) {
  const message = operation.messageId ? await prisma.message.findUnique({ where: { id: operation.messageId } }) : null;
  return { success: true, message, accountNumber: operation.accountNumber };
}
