import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = [
    'Food',
    'Transport',
    'Bills',
    'Health',
    'Shopping',
    'Entertainment',
    'Education',
    'Salary',
    'Freelance',
  ];

  for (const name of defaultCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        isDefault: true,
      },
    });
  }

  console.log('Default categories seeded');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
