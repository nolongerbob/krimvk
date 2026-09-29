/** @jest-environment node */
import { consumeYandexLink } from '@/lib/yandex-link';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }));
function transaction(consumed: number, existing: null | {userId:string}) {
  const tx = { verificationToken:{deleteMany:jest.fn().mockResolvedValue({count:consumed})}, account:{findUnique:jest.fn().mockResolvedValue(existing),create:jest.fn()} };
  (prisma.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
  return tx;
}
it('rejects expired, wrong-user and already consumed intentions', async()=>{
  const tx=transaction(0,null);
  expect(await consumeYandexLink('nonce','local','external')).toBe(false);
  expect(tx.account.create).not.toHaveBeenCalled();
  expect(tx.verificationToken.deleteMany).toHaveBeenCalledWith({where:{token:'nonce',identifier:'yandex-link:local',expires:{gt:expect.any(Date)}}});
});
it('does not transfer another user identity',async()=>{
  const tx=transaction(1,{userId:'other'});
  expect(await consumeYandexLink('nonce','local','external')).toBe(false);
  expect(tx.account.create).not.toHaveBeenCalled();
});
it('creates only the explicit identity association, without OAuth tokens',async()=>{
  const tx=transaction(1,null);
  expect(await consumeYandexLink('nonce','local','external')).toBe(true);
  expect(tx.account.create).toHaveBeenCalledWith({data:{userId:'local',provider:'yandex',providerAccountId:'external',type:'oauth'}});
});
