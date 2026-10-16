import path from 'node:path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    earlyAccess: true,
    schema: "prisma/schema.prisma",
    migrations: {
        seed: async (tx: any) => {
            const { seedReferenceData, disconnectSeedClient } = await import('./src/db/prisma/seed');
            try {
                await seedReferenceData();
            } finally {
                await disconnectSeedClient();
            }
        },
    },
});
