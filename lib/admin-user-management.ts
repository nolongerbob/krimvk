import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cacheDel } from '@/lib/cache/redis';
import { invalidateUserBalance } from '@/lib/admin-users-index';

export class AdminUserError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const textField = (max: number) => z.string().trim().max(max)
  .refine(value => !/[\u0000-\u001f\u007f]/.test(value), 'Текст содержит недопустимые символы')
  .transform(value => value.replace(/\s+/g, ' ') || null).nullable().optional();
export const adminProfilePatchSchema = z.object({
  name: textField(150), phone: textField(50), address: textField(500),
}).strict().refine(value => Object.keys(value).length > 0, 'Нет данных для обновления');

const managedUserSelect = {
  id: true, email: true, name: true, phone: true, address: true, role: true,
  _count: { select: { news: true, pages: true, posts: true } },
} satisfies Prisma.UserSelect;
type ManagedUser = Prisma.UserGetPayload<{ select: typeof managedUserSelect }>;

export function deletionBlockReason(actorId: string, user: ManagedUser) {
  if (user.id === actorId) return 'Нельзя удалить свой аккаунт из панели администратора.';
  if (user.role === 'ADMIN') return 'Сначала другой администратор должен изменить роль этого пользователя на «Пользователь».';
  if (user._count.news || user._count.pages || user._count.posts) return 'У пользователя есть материалы сайта. Сначала перенесите их другому автору, чтобы не удалить публикации.';
  return null;
}

async function withManagedUser<T>(actorId: string, userId: string, action: (tx: Prisma.TransactionClient, user: ManagedUser) => Promise<T>) {
  return prisma.$transaction(async tx => {
    // Both locks use one stable order. Concurrent role changes, deletion and
    // unlink operations cannot invalidate the permission/recovery checks.
    await tx.$queryRaw`SELECT id FROM users WHERE id IN (${actorId}, ${userId}) ORDER BY id FOR UPDATE`;
    const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true } });
    if (actor?.role !== 'ADMIN') throw new AdminUserError('Доступ запрещён', 403);
    const user = await tx.user.findUnique({ where: { id: userId }, select: managedUserSelect });
    if (!user) throw new AdminUserError('Пользователь не найден', 404);
    return action(tx, user);
  }, { timeout: 15000 });
}

export async function updateAdminUserProfile(actorId: string, userId: string, input: unknown) {
  const parsed = adminProfilePatchSchema.safeParse(input);
  if (!parsed.success) throw new AdminUserError(parsed.error.issues[0]?.message || 'Некорректные данные', 400);
  const user = await withManagedUser(actorId, userId, tx => tx.user.update({
    where: { id: userId }, data: parsed.data,
    select: { id: true, email: true, name: true, phone: true, address: true, role: true },
  }));
  console.info('[admin-user-update]', { actorId, userId, fields: Object.keys(parsed.data) });
  return user;
}

export async function deleteAdminUser(actorId: string, userId: string, confirmation: string) {
  await withManagedUser(actorId, userId, async (tx, user) => {
    const blocked = deletionBlockReason(actorId, user);
    if (blocked) throw new AdminUserError(blocked, 409);
    // Bind confirmation to this exact profile, not a generic DELETE word.
    if (confirmation !== user.email) throw new AdminUserError('Введите текущую почту удаляемого пользователя', 400);
    await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: `email-change:${userId}:` } } });
    // Existing cascades delete only this website identity and its history.
    // Contracts/emergency reports retain their records via SET NULL. No 1C writes.
    await tx.user.delete({ where: { id: userId } });
  });
  await cacheDel(`admin-role:${userId}`);
  invalidateUserBalance(userId);
  console.info('[admin-user-delete]', { actorId, userId });
}

export async function getAdminUserSettings(actorId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: {
    ...managedUserSelect, password: true, emailVerified: true,
    accounts: { select: { id: true, provider: true }, orderBy: { id: 'asc' } },
    _count: { select: { news: true, pages: true, posts: true, applications: true, questions: true, userAccounts: true, meters: true, bills: true } },
  } });
  if (!user) throw new AdminUserError('Пользователь не найден', 404);
  const hasPasswordLogin = Boolean(user.password && user.emailVerified);
  return {
    // Never return hashes, provider IDs, OAuth tokens or credentials to the UI.
    linkedServices: user.accounts,
    canUnlinkService: hasPasswordLogin || user.accounts.length > 1,
    deletionBlockReason: deletionBlockReason(actorId, user),
    deletionSummary: { accounts: user._count.userAccounts, applications: user._count.applications, questions: user._count.questions, meters: user._count.meters, bills: user._count.bills },
  };
}

export async function unlinkAdminUserService(actorId: string, userId: string, linkId: string, confirmation: string) {
  await withManagedUser(actorId, userId, async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: {
      password: true, emailVerified: true, accounts: { select: { id: true, provider: true } },
    } });
    if (!user) throw new AdminUserError('Пользователь не найден', 404);
    const link = user.accounts.find(account => account.id === linkId);
    if (!link) throw new AdminUserError('Привязка сервиса не найдена', 404);
    if (confirmation !== link.provider) throw new AdminUserError('Подтвердите отвязку выбранного сервиса', 400);
    if (user.accounts.length <= 1 && !(user.password && user.emailVerified))
      throw new AdminUserError('Это последний способ входа. Сначала пользователь должен привязать другой сервис или задать пароль и подтвердить почту.', 409);
    await tx.account.deleteMany({ where: { id: linkId, userId } });
  });
  console.info('[admin-user-service-unlink]', { actorId, userId, linkId });
}
