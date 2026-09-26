import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { requireSeedPassword } from './seed-env';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(requireSeedPassword('SEED_ADMIN_PASSWORD'), 10);

  const _superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@barbearia.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@barbearia.com',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
