import { app } from 'electron';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as fs from 'fs';

const IS_PROD = app.isPackaged;
const PG_PORT = 54320;
const EMBEDDED_DB_NAME = 'bibliotecatec8';
const EMBEDDED_DB_USER = 'postgres';
const EMBEDDED_DB_PASSWORD = 'postgres';

export interface PostgresConfig {
	port: number;
	dbName: string;
	user: string;
	password: string;
	host: string;
}

export function getPostgresConfig(): PostgresConfig {
	return {
		port: PG_PORT,
		dbName: EMBEDDED_DB_NAME,
		user: EMBEDDED_DB_USER,
		password: EMBEDDED_DB_PASSWORD,
		host: 'localhost'
	};
}

export function getPgPaths() {
	const candidates = [
		IS_PROD ? path.join(process.resourcesPath, 'pgsql') : path.resolve(__dirname, '..', '..', '..', 'resources', 'pgsql'),
		IS_PROD ? path.join(process.resourcesPath, 'postgres') : path.resolve(__dirname, '..', '..', '..', 'resources', 'postgres'),
		path.join(app.getAppPath(), 'resources', 'pgsql'),
		path.join(app.getAppPath(), 'resources', 'postgres'),
		path.resolve(__dirname, '..', '..', 'resources', 'pgsql'),
		path.resolve(__dirname, '..', '..', 'resources', 'postgres')
	];

	const pgBase = candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
	const dbDir = path.join(app.getPath('userData'), 'db');

	return {
		binDir: path.join(pgBase, 'bin'),
		dbDir
	};
}

export function getPgBinary(toolName: 'pg_dump' | 'pg_restore' | 'psql' | 'pg_ctl' | 'initdb' | 'createdb'): string {
	const exeName = process.platform === 'win32' ? `${toolName}.exe` : toolName;

	const { binDir } = getPgPaths();
	const bundledPath = path.join(binDir, exeName);
	if (fs.existsSync(bundledPath)) {
		return bundledPath;
	}

	if (process.platform === 'win32') {
		const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
		const pgDir = path.join(programFiles, 'PostgreSQL');
		if (fs.existsSync(pgDir)) {
			try {
				const versions = fs.readdirSync(pgDir).sort((a, b) => Number(b) - Number(a));
				for (const ver of versions) {
					const candidate = path.join(pgDir, ver, 'bin', exeName);
					if (fs.existsSync(candidate)) {
						return candidate;
					}
				}
			} catch { }
		}
	}

	return toolName;
}

function isDatabaseClusterInitialized(dbDir: string): boolean {
	return fs.existsSync(path.join(dbDir, 'PG_VERSION'));
}

function runPgCommand(commandPath: string, args: string[], errorLabel: string): void {
	const result = spawnSync(commandPath, args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
		shell: false
	});

	if (result.stdout) {
		process.stdout.write(result.stdout);
	}
	if (result.stderr) {
		process.stderr.write(result.stderr);
	}

	if (result.status !== 0) {
		const code = result.status === null ? 'unknown' : String(result.status);
		const details = result.stderr?.trim() || result.error?.message;
		throw new Error(details ? `${errorLabel} falló con código ${code}: ${details}` : `${errorLabel} falló con código ${code}.`);
	}
}

export async function startEmbeddedPostgres(): Promise<void> {
	const { binDir, dbDir } = getPgPaths();
	const config = getPostgresConfig();

	if (!fs.existsSync(binDir)) {
		throw new Error(
			`No se encontraron los binarios de PostgreSQL en: ${binDir}\n` +
			`Ejecutá "npm run download-pg" para descargarlos.`
		);
	}

	const initDbPath = path.join(binDir, 'initdb.exe');
	const pgCtlPath = path.join(binDir, 'pg_ctl.exe');
	const createDbPath = path.join(binDir, 'createdb.exe');
	const logFilePath = path.join(dbDir, 'postgresql.log');

	if (!isDatabaseClusterInitialized(dbDir)) {
		console.log('[PG] Inicializando base de datos embebida...');
		fs.mkdirSync(dbDir, { recursive: true });
		runPgCommand(
			initDbPath,
			['-D', dbDir, '-U', config.user, '-E', 'UTF8', '--auth=trust'],
			'Inicialización de PostgreSQL'
		);
	}

	console.log('[PG] Iniciando servidor PostgreSQL en puerto', config.port);
	runPgCommand(
		pgCtlPath,
		['start', '-D', dbDir, '-w', '-l', logFilePath, '-o', `-p ${config.port}`],
		'Inicio de PostgreSQL'
	);

	const createDbResult = spawnSync(createDbPath, ['-p', String(config.port), '-U', config.user, config.dbName], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
		shell: false
	});

	if (createDbResult.stdout) {
		process.stdout.write(createDbResult.stdout);
	}
	if (createDbResult.stderr) {
		process.stderr.write(createDbResult.stderr);
	}

	if (createDbResult.status !== 0) {
		const stderr = createDbResult.stderr ? createDbResult.stderr.trim() : '';
		if (!stderr.includes('already exists')) {
			throw new Error(stderr || 'No se pudo crear la base de datos.');
		}
	}

	console.log('[PG] Base de datos lista:', config.dbName);
}

export function stopEmbeddedPostgres(): void {
	if (!IS_PROD) return;

	const { binDir, dbDir } = getPgPaths();
	const pgCtlPath = path.join(binDir, 'pg_ctl.exe');

	if (fs.existsSync(pgCtlPath)) {
		try {
			console.log('[PG] Deteniendo PostgreSQL...');
			runPgCommand(pgCtlPath, ['stop', '-D', dbDir, '-m', 'fast'], 'Detención de PostgreSQL');
		} catch (e) {
			console.error('[PG] Error al detener PostgreSQL:', e);
		}
	}
}

export function setupPostgresEnv(): void {
	const { binDir } = getPgPaths();
	if (fs.existsSync(binDir)) {
		process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;
	} else if (process.platform === 'win32') {
		const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
		const pgDir = path.join(programFiles, 'PostgreSQL');
		if (fs.existsSync(pgDir)) {
			try {
				const versions = fs.readdirSync(pgDir).sort((a, b) => Number(b) - Number(a));
				for (const ver of versions) {
					const candidateBin = path.join(pgDir, ver, 'bin');
					if (fs.existsSync(candidateBin)) {
						process.env.PATH = `${candidateBin}${path.delimiter}${process.env.PATH || ''}`;
						break;
					}
				}
			} catch { }
		}
	}

	if (IS_PROD) {
		const config = getPostgresConfig();
		process.env.DB_PORT = String(config.port);
		process.env.DB_NAME = config.dbName;
		process.env.DB_USER = config.user;
		process.env.DB_PASSWORD = config.password;
		process.env.DB_HOST = config.host;
		console.log('[PG] Variables de entorno configuradas para producción');
	}
}
