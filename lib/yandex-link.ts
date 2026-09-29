import { prisma } from './prisma';

export const YANDEX_LINK_COOKIE = 'krimvk-yandex-link';
export async function consumeYandexLink(token: string, userId: string, providerAccountId: string) {
  return prisma.$transaction(async tx => {
    const intent = await tx.verificationToken.deleteMany({ where: {
      token, identifier: `yandex-link:${userId}`, expires: { gt: new Date() },
    } });
    if (intent.count !== 1) return false;
    const existing = await tx.account.findUnique({ where: { provider_providerAccountId: { provider: 'yandex', providerAccountId } } });
    if (existing) return existing.userId === userId;
    await tx.account.create({ data: { userId, provider: 'yandex', providerAccountId, type: 'oauth' } });
    return true;
  });
}
