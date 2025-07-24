import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  const collections = [
    { name: 'clothes' },
    { name: 'shoes' },
    { name: 'bags' },
    { name: 'accessories' },
    { name: 'new arrivals' }
  ];

  for (const data of collections) {
    await prisma.collection.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
  }
  console.log('Collections seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());