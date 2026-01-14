import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { code: "FREE" },
    update: { name: "Free", monthlyQuota: 20 },
    create: { code: "FREE", name: "Free", monthlyQuota: 20 },
  });

  await prisma.plan.upsert({
    where: { code: "PRO" },
    update: { name: "Pro", monthlyQuota: 500 },
    create: { code: "PRO", name: "Pro", monthlyQuota: 500 },
  });

  await prisma.plan.upsert({
    where: { code: "PREMIUM" },
    update: { name: "Premium", monthlyQuota: 2000 },
    create: { code: "PREMIUM", name: "Premium", monthlyQuota: 2000 },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });