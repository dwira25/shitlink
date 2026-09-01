import argon2 from "argon2";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => any };

const prisma = new PrismaClient();

async function main() {
  const email = process.env.MASTER_EMAIL;
  const rawPassword = process.env.MASTER_PASSWORD;
  const name = process.env.MASTER_NAME || "Master Admin";

  if (!email || !rawPassword) {
    throw new Error(
      "MASTER_EMAIL and MASTER_PASSWORD env vars are required to bootstrap the Master User (no static/hardcoded credentials allowed)."
    );
  }

  const existingMaster = await prisma.user.findFirst({ where: { role: "MASTER" } });
  if (existingMaster) {
    console.log("Master user already exists, skipping bootstrap.");
    return;
  }

  const password = await argon2.hash(rawPassword, { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email },
    update: { role: "MASTER", isActive: true },
    create: {
      name,
      email,
      password,
      role: "MASTER",
      isActive: true
    }
  });

  console.log(`Master user bootstrapped: ${email}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
