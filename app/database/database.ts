import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
