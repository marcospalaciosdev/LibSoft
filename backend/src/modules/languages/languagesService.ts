import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAvailableLanguages() {
    try {
        const languages = await prisma.languages.findMany({
            orderBy: [
                { name: 'asc' }
            ]
        });
        return languages;
    } catch (e) {
        console.log("[getAvailableLanguages] error", e);
        return [];
    }
}