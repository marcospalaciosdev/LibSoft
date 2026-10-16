import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient, dewey_classification_status } from '@prisma/client';
import { moduleSeeds } from './seed/moduleSeeds';
import { languageSeeds, type SeedLanguageCode } from './seed/languageSeeds';
import { roleSeeds, type RoleSeed } from './seed/rolesSeed';
import { type DeweySeedStatus } from './seed/deweyStatusSeed';

dotenv.config({ override: false });

if (!process.env.DATABASE_URL) {
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME;

    if (user && password && host && database) {
        process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    }
}

const prisma = new PrismaClient();

const supportedLanguageCodes = languageSeeds.map(({ code }) => code);

function parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current.replace(/^\uFEFF/, '').trim());
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current.replace(/^\uFEFF/, '').trim());
    return values;
}

function resolveDeweyCsvPaths() {
    const rootCandidates = [
        path.resolve(__dirname, 'seed', 'dewey-classifications-es.csv'),
        path.resolve(__dirname, 'seed', 'dewey-classifications.csv'),
        path.resolve(process.cwd(), 'src', 'db', 'prisma', 'seed', 'dewey-classifications-es.csv'),
        path.resolve(process.cwd(), 'backend', 'src', 'db', 'prisma', 'seed', 'dewey-classifications-es.csv'),
        path.resolve(__dirname, '..', '..', '..', '..', 'dewey-classifications-es.csv'),
        path.resolve(__dirname, '..', '..', '..', '..', 'dewey-classifications.csv'),
        path.resolve(process.cwd(), '..', 'dewey-classifications.csv'),
        path.resolve(process.cwd(), 'dewey-classifications.csv'),
    ];

    const englishCandidates = [
        path.resolve(__dirname, 'seed', 'dewey-classifications-en.csv'),
        path.resolve(process.cwd(), 'src', 'db', 'prisma', 'seed', 'dewey-classifications-en.csv'),
        path.resolve(process.cwd(), 'backend', 'src', 'db', 'prisma', 'seed', 'dewey-classifications-en.csv'),
        path.resolve(__dirname, '..', '..', '..', '..', 'dewey-classifications-en.csv'),
        path.resolve(process.cwd(), '..', 'dewey-classifications-en.csv'),
        path.resolve(process.cwd(), 'dewey-classifications-en.csv'),
    ];

    const es = rootCandidates.find((candidate) => fs.existsSync(candidate));
    const en = englishCandidates.find((candidate) => fs.existsSync(candidate));

    if (!es || !en) {
        throw new Error(
            `No se encontraron los CSV de Dewey requeridos. ES probados: ${rootCandidates.join(', ')}. EN probados: ${englishCandidates.join(', ')}`,
        );
    }

    return { es, en };
}

function determineDeweyStatus(englishLabel: string, spanishLabel: string): DeweySeedStatus {
    const normalizedEn = englishLabel.trim().toLowerCase();
    const normalizedEs = spanishLabel.trim().toLowerCase();

    if (
        normalizedEn.includes('[unassigned]') ||
        normalizedEs.includes('[no asignado]')
    ) {
        return 'unassigned';
    }

    if (
        normalizedEn.includes('not applicable') ||
        normalizedEn.includes('formerly') ||
        normalizedEn.includes('previously') ||
        normalizedEs.includes('no aplicable') ||
        normalizedEs.includes('anteriormente') ||
        normalizedEs.includes('previamente') ||
        normalizedEs.includes('solía ser')
    ) {
        return 'discontinued';
    }

    return 'in_use';
}

function loadDeweyEntries() {
    const filePaths = resolveDeweyCsvPaths();
    const entriesByCode = new Map<string, Partial<Record<SeedLanguageCode, string>>>();

    for (const [languageCode, filePath] of Object.entries(filePaths) as Array<[SeedLanguageCode, string]>) {
        const lines = fs
            .readFileSync(filePath, 'utf8')
            .split(/\r?\n/)
            .filter((line) => line.trim().length > 0);

        for (const line of lines.slice(1)) {
            const [, code, langCode, name] = parseCsvLine(line);

            if (!/^\d{3}$/.test(code) || langCode !== languageCode || !name?.trim()) {
                continue;
            }

            const current = entriesByCode.get(code) ?? {};
            current[languageCode] = name.trim();
            entriesByCode.set(code, current);
        }
    }

    return Array.from(entriesByCode.entries())
        .filter(([, labels]) => Boolean(labels.en) || Boolean(labels.es))
        .map(([code, labels]) => {
            const englishLabel = labels.en?.trim() || code;
            const spanishLabel = labels.es?.trim() || englishLabel;

            return {
                code,
                status: determineDeweyStatus(englishLabel, spanishLabel),
                translations: {
                    en: englishLabel,
                    es: spanishLabel,
                },
            };
        });
}

async function purgeUnsupportedLanguages() {
    const unsupportedLanguages = await prisma.languages.findMany({
        where: {
            code: {
                notIn: supportedLanguageCodes,
            },
        },
        select: { code: true },
    });

    if (unsupportedLanguages.length === 0) {
        return;
    }

    const unsupportedCodes = unsupportedLanguages.map(({ code }) => code);

    await prisma.dewey_classifications_translations.deleteMany({
        where: {
            lang_code: {
                in: unsupportedCodes,
            },
        },
    });

    await prisma.roles_names.deleteMany({
        where: {
            lng_id: {
                in: unsupportedCodes,
            },
        },
    });

    await prisma.roles_descriptions.deleteMany({
        where: {
            lng_id: {
                in: unsupportedCodes,
            },
        },
    });

    await prisma.languages.deleteMany({
        where: {
            code: {
                in: unsupportedCodes,
            },
        },
    });
}

async function seedLanguages() {
    await purgeUnsupportedLanguages();

    for (const language of languageSeeds) {
        await prisma.languages.upsert({
            where: { code: language.code },
            update: {
                name: language.name,
                is_active: true,
            },
            create: {
                code: language.code,
                name: language.name,
                is_active: true,
            },
        });
    }
}

async function seedLibraryProfile() {
    await prisma.library_profile.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            library_name: 'Mi biblioteca',
        },
    });
}

async function seedDewey() {
    const deweyEntries = loadDeweyEntries();
    const statusMap: Record<DeweySeedStatus, dewey_classification_status> = {
        in_use: dewey_classification_status.in_use,
        unassigned: dewey_classification_status.unassigned,
        discontinued: dewey_classification_status.discontinued,
    };

    for (const entry of deweyEntries) {
        await prisma.dewey_classifications.upsert({
            where: { code: entry.code },
            update: {
                status: statusMap[entry.status],
            },
            create: {
                code: entry.code,
                status: statusMap[entry.status],
            },
        });

        for (const language of languageSeeds) {
            await prisma.dewey_classifications_translations.upsert({
                where: {
                    dewey_classification_id_lang_code: {
                        dewey_classification_id: entry.code,
                        lang_code: language.code,
                    },
                },
                update: {
                    name: entry.translations[language.code],
                },
                create: {
                    dewey_classification_id: entry.code,
                    lang_code: language.code,
                    name: entry.translations[language.code],
                },
            });
        }
    }
}

async function seedModulesAndPermissions() {
    const permissionIdsByKey = new Map<string, bigint>();

    for (const moduleSeed of moduleSeeds) {
        const moduleRecord = await prisma.modules.upsert({
            where: { name: moduleSeed.name },
            update: {},
            create: { name: moduleSeed.name },
        });

        for (const permissionSeed of moduleSeed.permissions) {
            const permissionRecord = await prisma.permissions.upsert({
                where: {
                    module_id_name: {
                        module_id: moduleRecord.id,
                        name: permissionSeed.name,
                    },
                },
                update: {
                    description: permissionSeed.description,
                },
                create: {
                    module_id: moduleRecord.id,
                    name: permissionSeed.name,
                    description: permissionSeed.description,
                },
            });

            permissionIdsByKey.set(`${moduleSeed.name}.${permissionSeed.name}`, permissionRecord.id);
        }
    }

    return permissionIdsByKey;
}

async function seedRoles(permissionIdsByKey: Map<string, bigint>) {
    for (const roleSeed of roleSeeds) {
        const roleRecord = await prisma.roles.upsert({
            where: { name: roleSeed.key },
            update: { color_rgb: roleSeed.colorRGB, type: roleSeed.type },
            create: {
                name: roleSeed.key,
                color_rgb: roleSeed.colorRGB,
                type: roleSeed.type,
            },
        });

        for (const language of languageSeeds) {
            const langCode = language.code as SeedLanguageCode;
            const translatedName = roleSeed.names[langCode] ?? roleSeed.names.en;
            const translatedDescription = roleSeed.descriptions[langCode] ?? roleSeed.descriptions.en;

            await prisma.roles_names.upsert({
                where: {
                    role_id_lng_id: {
                        role_id: roleRecord.id,
                        lng_id: langCode,
                    },
                },
                update: { name: translatedName },
                create: {
                    role_id: roleRecord.id,
                    lng_id: langCode,
                    name: translatedName,
                },
            });

            // Upsert de Descripciones
            await prisma.roles_descriptions.upsert({
                where: {
                    role_id_lng_id: {
                        role_id: roleRecord.id,
                        lng_id: langCode,
                    },
                },
                update: { description: translatedDescription },
                create: {
                    role_id: roleRecord.id,
                    lng_id: langCode,
                    description: translatedDescription,
                },
            });
        }

        // 3. Sincronización Eficiente de Permisos
        const desiredPermissionIds = Array.from(permissionIdsByKey.entries())
            .filter(([key]) => {
                const [moduleName, permissionName] = key.split('.');
                return roleSeed.permissionMatcher(moduleName, permissionName);
            })
            .map(([, permissionId]) => permissionId);

        // Ejecutamos la limpieza y recreación en una sola transacción
        await prisma.$transaction([
            // Eliminar permisos obsoletos
            prisma.roles_permissions.deleteMany({
                where: {
                    role_id: roleRecord.id,
                    permission_id: {
                        notIn: desiredPermissionIds,
                    },
                },
            }),
            // Insertar nuevos permisos de golpe (mucho más rápido que un loop de upserts)
            prisma.roles_permissions.createMany({
                data: desiredPermissionIds.map((permissionId) => ({
                    role_id: roleRecord.id,
                    permission_id: permissionId,
                })),
                skipDuplicates: true, // Ignora si ya existen
            }),
        ]);
    }
}

function resolveFaqsJsonPath() {
    const candidates = [
        path.resolve(__dirname, 'seed', 'faqs', 'faqs.json'),
        path.resolve(process.cwd(), 'src', 'db', 'prisma', 'seed', 'faqs', 'faqs.json'),
        path.resolve(process.cwd(), 'backend', 'src', 'db', 'prisma', 'seed', 'faqs', 'faqs.json'),
        path.resolve(__dirname, '..', '..', '..', '..', 'faqs.json'),
    ];
    const found = candidates.find((c) => fs.existsSync(c));
    if (!found) {
        throw new Error(`No se encontró faqs.json. Probados: ${candidates.join(', ')}`);
    }
    return found;
}

interface FaqSeedItem {
    code: string;
    category?: string;
    question: Record<string, string>;
    answer: Record<string, string>;
}

async function seedFaqs() {
    const faqsPath = resolveFaqsJsonPath();
    const faqsData: FaqSeedItem[] = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));

    for (const item of faqsData) {
        const faqRecord = await prisma.faqs.upsert({
            where: { code: item.code },
            update: {
                category: item.category ?? null,
                updated_at: new Date(),
            },
            create: {
                code: item.code,
                category: item.category ?? null,
            },
        });

        for (const language of languageSeeds) {
            const langCode = language.code;
            const question = item.question[langCode] ?? item.question.es ?? item.question.en;
            const answer = item.answer[langCode] ?? item.answer.es ?? item.answer.en;

            if (question && answer) {
                await prisma.faq_translations.upsert({
                    where: {
                        faq_id_language_code: {
                            faq_id: faqRecord.id,
                            language_code: langCode,
                        },
                    },
                    update: {
                        question,
                        answer,
                    },
                    create: {
                        faq_id: faqRecord.id,
                        language_code: langCode,
                        question,
                        answer,
                    },
                });
            }
        }
    }
}

export async function seedReferenceData() {
    await seedLanguages();
    await seedLibraryProfile();
    await seedDewey();
    const permissionIdsByKey = await seedModulesAndPermissions();
    await seedRoles(permissionIdsByKey);
    await seedFaqs();
}

export async function disconnectSeedClient() {
    await prisma.$disconnect();
}

async function runStandalone() {
    try {
        await seedReferenceData();
        console.log('Reference data seeded successfully.');
    } finally {
        await disconnectSeedClient();
    }
}

if (require.main === module) {
    runStandalone().catch((error) => {
        console.error('Seed script failed:', error);
        process.exit(1);
    });
}
