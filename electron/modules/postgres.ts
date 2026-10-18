import { app } from 'electron';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as fs from 'fs';

/**
 * Postgres Module
 *
 * Manages the embedded PostgreSQL instance bundled with the production build.
 * In development, an external PostgreSQL installation is used instead.
 *
 * Responsibilities:
 * - Resolving paths to bundled PostgreSQL binaries
 * - Initializing the database cluster on first run (initdb)
 * - Starting and stopping the PostgreSQL server (pg_ctl)
 * - Setting up PATH and environment variables so pg tools are accessible
 */

const IS_PROD = app.isPackaged;

// Port used by the embedded PostgreSQL instance (avoids conflicts with system installs)
const PG_PORT = 54320;

// Default database name, user and password for the embedded instance
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

/**
 * Returns the connection configuration for the embedded PostgreSQL instance.
 */
export function getPostgresConfig(): PostgresConfig {
	return {
		port: PG_PORT,
		dbName: EMBEDDED_DB_NAME,
		user: EMBEDDED_DB_USER,
		password: EMBEDDED_DB_PASSWORD,
		host: 'localhost'
	};
}

/**
 * Resolves the paths to the embedded PostgreSQL binaries and the data directory.
 *
 * Tries several candidate locations in order, supporting both development (source tree)
 * and production (packaged resources) environments. Falls back to the first candidate
 * if none is found (will fail gracefully later with a clear error).
 *
 * @returns Object with:
 *   - binDir: absolute path to the PostgreSQL bin/ directory
 *   - dbDir: absolute path to the database data directory (in userData)
 */
export function getPgPaths() {
	const candidates = [
		IS_PROD ? path.join(process.resourcesPath, 'pgsql') : path.resolve(__dirname, '..', '..', '..', 'resources', 'pgsql'),
		IS_PROD ? path.join(process.resourcesPath, 'postgres') : path.resolve(__dirname, '..', '..', '..', 'resources', 'postgres'),
		path.join(app.getAppPath(), 'resources', 'pgsql'),
		path.join(app.getAppPath(), 'resources', 'postgres'),
		path.resolve(__dirname, '..', '..', 'resources', 'pgsql'),
		path.resolve(__dirname, '..', '..', 'resources', 'postgres')
	];

	// Use the first candidate directory that actually exists
	const pgBase = candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];

	// The database cluster lives in the user's appData folder, persisted between runs
	const dbDir = path.join(app.getPath('userData'), 'db');

	return {
		binDir: path.join(pgBase, 'bin'),
		dbDir
	};
}

/**
 * Resolves the absolute path to a specific PostgreSQL command-line tool.
 *
 * Resolution order:
 *  1. Bundled binary in the app's pgsql/bin directory
 *  2. System-installed PostgreSQL (Windows only, via Program Files)
 *  3. Falls back to the bare tool name (relies on PATH)
 *
 * @param toolName - The pg tool to locate (e.g. 'pg_dump', 'psql', 'pg_ctl').
 * @returns Absolute path to the binary, or just the tool name if not found locally.
 */
export function getPgBinary(toolName: 'pg_dump' | 'pg_restore' | 'psql' | 'pg_ctl' | 'initdb' | 'createdb'): string {
	// Add .exe extension on Windows
	const exeName = process.platform === 'win32' ? `${toolName}.exe` : toolName;

	const { binDir } = getPgPaths();
	const bundledPath = path.join(binDir, exeName);
	if (fs.existsSync(bundledPath)) {
		return bundledPath;
	}

	// On Windows, search installed PostgreSQL versions in Program Files (newest first)
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

	// Last resort: rely on the tool being available in the system PATH
	return toolName;
}

/**
 * Returns true if the PostgreSQL data directory has already been initialized
 * (i.e. initdb has been run before).
 *
 * @param dbDir - Path to the PostgreSQL data directory.
 */
function isDatabaseClusterInitialized(dbDir: string): boolean {
	// initdb creates a PG_VERSION file in the data directory
	return fs.existsSync(path.join(dbDir, 'PG_VERSION'));
}

/**
 * Runs a PostgreSQL command synchronously and throws on non-zero exit.
 * Forwards stdout/stderr to the current process for visibility in logs.
 *
 * @param commandPath - Absolute path to the pg binary to run.
 * @param args - Command-line arguments to pass.
 * @param errorLabel - Human-readable label used in the thrown error message.
 */
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
		throw new Error(details ? `${errorLabel} failed with code ${code}: ${details}` : `${errorLabel} failed with code ${code}.`);
	}
}

/**
 * Starts the embedded PostgreSQL server.
 *
 * On first run, initializes the database cluster with initdb.
 * Then starts the server with pg_ctl and creates the application database
 * if it does not already exist.
 *
 * Only called in production builds (IS_PROD).
 */
export async function startEmbeddedPostgres(): Promise<void> {
	const { binDir, dbDir } = getPgPaths();
	const config = getPostgresConfig();

	if (!fs.existsSync(binDir)) {
		throw new Error(
			`PostgreSQL binaries not found at: ${binDir}\n` +
			`Run "npm run download-pg" to download them.`
		);
	}

	const initDbPath = path.join(binDir, 'initdb.exe');
	const pgCtlPath = path.join(binDir, 'pg_ctl.exe');
	const createDbPath = path.join(binDir, 'createdb.exe');
	const logFilePath = path.join(dbDir, 'postgresql.log');

	// Initialize the database cluster if this is the first run
	if (!isDatabaseClusterInitialized(dbDir)) {
		console.log('[PG] Initializing embedded database cluster...');
		fs.mkdirSync(dbDir, { recursive: true });
		runPgCommand(
			initDbPath,
			['-D', dbDir, '-U', config.user, '-E', 'UTF8', '--auth=trust'],
			'PostgreSQL initdb'
		);
	}

	// Start the PostgreSQL server on the configured port
	console.log('[PG] Starting PostgreSQL server on port', config.port);
	runPgCommand(
		pgCtlPath,
		['start', '-D', dbDir, '-w', '-l', logFilePath, '-o', `-p ${config.port}`],
		'PostgreSQL startup'
	);

	// Create the application database (safe to run if it already exists)
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
		// Ignore the "already exists" error — it means the DB was created on a previous run
		if (!stderr.includes('already exists')) {
			throw new Error(stderr || 'Failed to create the application database.');
		}
	}

	console.log('[PG] Database ready:', config.dbName);
}

/**
 * Stops the embedded PostgreSQL server using a fast shutdown mode.
 * No-op in development mode (server is external and not managed by the app).
 */
export function stopEmbeddedPostgres(): void {
	if (!IS_PROD) return;

	const { binDir, dbDir } = getPgPaths();
	const pgCtlPath = path.join(binDir, 'pg_ctl.exe');

	if (fs.existsSync(pgCtlPath)) {
		try {
			console.log('[PG] Stopping PostgreSQL server...');
			// 'fast' mode: immediately terminates connections and stops cleanly
			runPgCommand(pgCtlPath, ['stop', '-D', dbDir, '-m', 'fast'], 'PostgreSQL shutdown');
		} catch (e) {
			console.error('[PG] Failed to stop PostgreSQL:', e);
		}
	}
}

/**
 * Prepends the PostgreSQL bin directory to the system PATH so pg tools
 * (pg_dump, psql, etc.) can be found by child processes without full paths.
 *
 * In production, also sets DB_* environment variables so the backend can
 * connect to the embedded PostgreSQL instance without any external configuration.
 */
export function setupPostgresEnv(): void {
	const { binDir } = getPgPaths();
	if (fs.existsSync(binDir)) {
		// Prepend the pg bin dir so it takes precedence over any system install
		process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;
	} else if (process.platform === 'win32') {
		// Fallback: search for a system-installed PostgreSQL and add its bin to PATH
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

	// In production, expose DB connection details as environment variables
	// so the Express backend can connect to the embedded PostgreSQL instance
	if (IS_PROD) {
		const config = getPostgresConfig();
		process.env.DB_PORT = String(config.port);
		process.env.DB_NAME = config.dbName;
		process.env.DB_USER = config.user;
		process.env.DB_PASSWORD = config.password;
		process.env.DB_HOST = config.host;
		console.log('[PG] Environment variables configured for production');
	}
}
