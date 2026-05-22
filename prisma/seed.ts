import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { configDotenv } from "dotenv";

configDotenv();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });


const prisma = new PrismaClient({ adapter });

async function main() {
    const botUser = await prisma.user.upsert({
        where: { email: "ai@korix.internal" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000000",
            email: "ai@korix.internal",
            name: "KorixAI",
            password: "not-a-real-password",
            isVerified: true,
        },
    });

    console.log("✅ AI bot user seeded:", botUser.id, botUser.name);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
