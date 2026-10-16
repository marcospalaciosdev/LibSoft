/**
 * Helper script para capturar el delta de schema en una migración.
 * Uso: npm run db:capture <nombre>
 * Ejemplo: npm run db:capture 0003_drop_authors
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const name = process.argv[2];
if (!name) {
    console.error('Error: Debes proporcionar un nombre para la migración.');
    console.error('Uso: npm run db:capture <nombre>');
    console.error('Ejemplo: npm run db:capture 0003_drop_authors');
    process.exit(1);
}

const shadowUrl = process.env.SHADOW_DATABASE_URL;
if (!shadowUrl) {
    console.error('Error: SHADOW_DATABASE_URL no está definida en .env');
    process.exit(1);
}

const migrationsDir = path.join('prisma', 'migrations');
const targetDir = path.join(migrationsDir, name);
const targetFile = path.join(targetDir, 'migration.sql');

if (fs.existsSync(targetDir)) {
    console.error(`Error: La carpeta ${targetDir} ya existe.`);
    process.exit(1);
}

console.log(`Capturando delta para: ${name}`);

const result = spawnSync(
    'npx',
    [
        'prisma', 'migrate', 'diff',
        '--from-migrations', 'prisma/migrations',
        '--to-schema-datamodel', 'prisma/schema.prisma',
        '--shadow-database-url', shadowUrl,
        '--script',
    ],
    {
        encoding: 'utf8',
        env: { ...process.env },
        shell: true,
    }
);

if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
}

const sql = result.stdout
    .split('\n')
    .filter(line => !line.startsWith('\u25c7') && !line.startsWith('â—‡'))
    .join('\n')
    .trim();

if (!sql || sql === '-- This is an empty migration.') {
    console.log('No hay cambios pendientes entre las migraciones y el schema actual.');
    process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetFile, sql, { encoding: 'utf8' });
console.log(`✓ Migración guardada en: ${targetFile}`);
console.log('');
console.log('Próximo paso — registrar como aplicada:');
console.log(`  npx prisma migrate resolve --applied ${name}`);