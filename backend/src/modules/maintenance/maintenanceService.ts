import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';

export interface BackupRecord {
    id: string;
    fileName: string;
    filePath: string;
    createdAt: string;
    size?: number;
}

export interface BackupRecordWithStatus extends BackupRecord {
    exists: boolean;
}

export interface RestoreResult {
    success: boolean;
    message: string;
}

const DB_USER = process.env.DB_USER ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = process.env.DB_PORT ?? '5432';
const DB_NAME = process.env.DB_NAME ?? 'library';

export class BackupService {
    private static getJsonPath(): string {
        return path.resolve(process.cwd(), 'userData/backups_history.json');
    }

    private static getBackupsDir(): string {
        return path.resolve(process.cwd(), 'userData/backups');
    }

    private static pgEnv() {
        return { ...process.env, PGPASSWORD: DB_PASSWORD };
    }

    private static async checkFileExists(filePath: string): Promise<boolean> {
        if (!filePath) return false;
        try {
            await access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    private static async readHistory(): Promise<BackupRecord[]> {
        const jsonPath = this.getJsonPath();
        try {
            const raw = await readFile(jsonPath, 'utf-8');
            return JSON.parse(raw) as BackupRecord[];
        } catch (err: any) {
            if (err.code === 'ENOENT') return [];
            throw err;
        }
    }

    private static async saveHistory(records: BackupRecord[]): Promise<void> {
        const jsonPath = this.getJsonPath();
        await mkdir(path.dirname(jsonPath), { recursive: true });
        await writeFile(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
    }

    public static async getBackupsHistory(): Promise<BackupRecordWithStatus[]> {
        const backups = await this.readHistory();
        return Promise.all(
            backups.map(async (backup) => ({
                ...backup,
                exists: await this.checkFileExists(backup.filePath),
            }))
        );
    }

    /**
     * Crea un backup de solo datos (sin estructura) con pg_dump.
     * La estructura la gestiona Prisma Migrate al restaurar.
     */
    public static async createBackup(): Promise<BackupRecord> {
        const backupsDir = this.getBackupsDir();
        await mkdir(backupsDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_${timestamp}.lsbak`;
        const filePath = path.join(backupsDir, fileName);

        const result = spawnSync(
            'pg_dump',
            [
                '-U', DB_USER,
                '-h', DB_HOST,
                '-p', DB_PORT,
                '--data-only',
                '--exclude-table=_prisma_migrations',
                '--format=custom',
                '--file', filePath,
                DB_NAME,
            ],
            { env: this.pgEnv(), encoding: 'utf8' }
        );

        if (result.status !== 0) {
            const errMsg = result.stderr || 'pg_dump falló sin mensaje de error.';
            throw new Error(`Error al crear el backup: ${errMsg}`);
        }

        const stat = await import('node:fs').then(fs => fs.promises.stat(filePath));

        const record: BackupRecord = {
            id: crypto.randomUUID(),
            fileName,
            filePath,
            createdAt: new Date().toISOString(),
            size: stat.size,
        };

        const history = await this.readHistory();
        history.unshift(record);
        await this.saveHistory(history);

        return record;
    }

    /**
     * Restaura la DB desde un backup .lsbak.
     * 1. Crea un backup de seguridad previo.
     * 2. Elimina y recrea la DB.
     * 3. Aplica migraciones Prisma (estructura).
     * 4. Restaura los datos con pg_restore.
     */
    public static async restoreBackup(filePath: string): Promise<RestoreResult> {
        const fileExists = await this.checkFileExists(filePath);
        if (!fileExists) {
            return { success: false, message: `No se encontró el archivo: ${filePath}` };
        }

        // Backup de seguridad antes de restaurar
        await this.createBackup();

        // Desconectar sesiones activas y recrear la DB
        const dropResult = spawnSync(
            'psql',
            [
                '-U', DB_USER,
                '-h', DB_HOST,
                '-p', DB_PORT,
                '-d', 'postgres',
                '-c', `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();`,
                '-c', `DROP DATABASE IF EXISTS "${DB_NAME}";`,
                '-c', `CREATE DATABASE "${DB_NAME}";`
            ],
            { env: this.pgEnv(), encoding: 'utf8' }
        );

        if (dropResult.status !== 0) {
            return { success: false, message: `Error al recrear la base de datos: ${dropResult.stderr}` };
        }

        // Aplicar estructura con Prisma Migrate
        const prismaBin = path.resolve(__dirname, '..', '..', '..', 'node_modules', '.bin', 'prisma');
        const migrateResult = spawnSync(
            prismaBin,
            ['migrate', 'deploy'],
            { env: { ...process.env }, encoding: 'utf8', shell: process.platform === 'win32' }
        );

        if (migrateResult.status !== 0) {
            return { success: false, message: `Error al aplicar migraciones: ${migrateResult.stderr}` };
        }

        // Restaurar datos
        const restoreResult = spawnSync(
            'pg_restore',
            [
                '-U', DB_USER,
                '-h', DB_HOST,
                '-p', DB_PORT,
                '--data-only',
                '--disable-triggers',
                '-d', DB_NAME,
                filePath,
            ],
            { env: this.pgEnv(), encoding: 'utf8' }
        );

        if (restoreResult.status !== 0) {
            return { success: false, message: `Error al restaurar los datos: ${restoreResult.stderr}` };
        }

        return { success: true, message: 'Base de datos restaurada correctamente.' };
    }
}
