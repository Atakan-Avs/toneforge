import { prisma } from "../config/prisma";

async function main() {
  const users = await prisma.user.findMany();

  for (const u of users) {
    // create a default org per user
    const org = await prisma.organization.create({
      data: { name: `${u.email.split("@")[0]}'s Workspace` },
    });

    await prisma.membership.create({
      data: { userId: u.id, orgId: org.id, role: "owner" },
    });

    await prisma.user.update({
      where: { id: u.id },
      data: { activeOrgId: org.id },
    });

    // backfill existing records by userId -> orgId
    await prisma.brandVoice.updateMany({
      where: { userId: u.id, orgId: null },
      data: { orgId: org.id },
    });

    await prisma.template.updateMany({
      where: { userId: u.id, orgId: null },
      data: { orgId: org.id },
    });

    await prisma.reply.updateMany({
      where: { userId: u.id, orgId: null },
      data: { orgId: org.id },
    });

    await prisma.usage.updateMany({
      where: { userId: u.id, orgId: null },
      data: { orgId: org.id },
    });
  }

  console.log("✅ Backfill completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });