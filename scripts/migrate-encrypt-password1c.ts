/**
 * Однократно шифрует password1c в userAccount (plain → enc1:…).
 *
 *   PASSWORD1C_ENCRYPTION_KEY=… npx tsx scripts/migrate-encrypt-password1c.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  encryptPassword1c,
  isEncryptedPassword1c,
} from '../lib/password1c-crypto';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.PASSWORD1C_ENCRYPTION_KEY?.trim()) {
    console.error('Set PASSWORD1C_ENCRYPTION_KEY before running.');
    process.exit(1);
  }

  const accounts = await prisma.userAccount.findMany({
    where: { password1c: { not: null } },
    select: { id: true, accountNumber: true, password1c: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const account of accounts) {
    const plain = account.password1c!;
    if (isEncryptedPassword1c(plain)) {
      skipped++;
      continue;
    }

    await prisma.userAccount.update({
      where: { id: account.id },
      data: { password1c: encryptPassword1c(plain) },
    });
    updated++;
    console.log(`encrypted: ${account.accountNumber} (${account.id})`);
  }

  console.log(`done: ${updated} updated, ${skipped} already encrypted`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
