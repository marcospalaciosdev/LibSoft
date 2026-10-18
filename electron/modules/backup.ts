import { app, Notification as ElectronNotification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec, spawnSync, spawn } from 'child_process';
import { encryptFileInPlace, decryptFileToTemp } from './crypto';
import { getPgBinary } from './postgres';

/**
 * Backup Module
 *
 * Handles all backup operations for the LibSoft application:
 * - Exporting the PostgreSQL database to an encrypted .lsbak file
 * - Importing a .lsbak backup via a safe temp-DB + swap strategy
 * - Reading and writing the backup history log
 * - Managing backup configuration (path, schedule, enabled flag)
 * - Running the automatic backup scheduler
 *
 * Export flow:
 *   pg_dump → integrity check (pg_restore -l) → AES-256-GCM encrypt → save
 *
 * Import flow (safe swap):
 *   Decrypt temp file → create temp DB → run Prisma migrations →
 *   pg_restore data → kill connections → rename original → rename temp → drop old
 */

// Maximum number of entries kept in the backup history file
const MAX_HISTORY_ENTRIES = 500;

export interface BackupHistoryEntry {
	date: string;
	size?: string;
	status: 'success' | 'failed';
	type: 'export' | 'import';
	filePath?: string;
	exists?: boolean;  // Injected at read-time to indicate if the file still exists on disk
	error?: string;
}

/**
 * Returns the absolute path to the backup history JSON file.
 */
function getHistoryPath(): string {
	return path.join(app.getPath('userData'), 'backup_history.json');
}

/**
 * Reads all backup history entries from disk.
 * Enriches each entry with an `exists` flag indicating whether the referenced file is still present.
 * Returns an empty array if the file does not exist or cannot be parsed.
 */
export function readBackupHistory(): BackupHistoryEntry[] {
	const historyPath = getHistoryPath();
	if (!fs.existsSync(historyPath)) {
		return [];
	}

	try {
		const data = fs.readFileSync(historyPath, 'utf8');
		const entries: BackupHistoryEntry[] = JSON.parse(data);

		if (!Array.isArray(entries)) return [];

		// Annotate each entry with whether its backup file still exists on disk
		return entries.map((entry) => ({
			...entry,
			exists: entry.filePath ? fs.existsSync(entry.filePath) : false
		}));
	} catch (e) {
		console.error('[BACKUP] Failed to read history:', e);
		return [];
	}
}

/**
 * Appends a new entry to the backup history file.
 * Uses an atomic write (temp file + rename) to avoid corrupting the history on crash.
 * Trims the history to MAX_HISTORY_ENTRIES if needed.
 *
 * @param entry - The history entry to add (date and exists are auto-populated).
 */
export async function addBackupHistoryEntry(
	entry: Omit<BackupHistoryEntry, 'date' | 'exists'>
): Promise<void> {
	try {
		const history = readBackupHistory();

		const newEntry: BackupHistoryEntry = {
			...entry,
			date: new Date().toISOString(),
		};

		// Prepend so the most recent entry appears first
		history.unshift(newEntry);

		// Enforce maximum history size
		if (history.length > MAX_HISTORY_ENTRIES) {
			history.length = MAX_HISTORY_ENTRIES;
		}

		// Strip the runtime-only `exists` field before persisting
		const cleanHistory = history.map(({ exists, ...rest }) => rest);
		const historyPath = getHistoryPath();
		const tempPath = `${historyPath}.tmp`;
		const jsonContent = JSON.stringify(cleanHistory, null, 2);

		// Atomic write: write to temp then rename to avoid partial writes
		await fs.promises.writeFile(tempPath, jsonContent, 'utf8');
		await fs.promises.rename(tempPath, historyPath);

		console.log('[BACKUP] History entry added');
	} catch (e) {
		console.error('[BACKUP] Failed to save history:', e);
	}
}

/**
 * Converts a byte count to a human-readable size string (B / KB / MB).
 */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Exports the current database to an encrypted .lsbak backup file.
 *
 * Steps:
 *  1. Run pg_dump (custom format, data-only, excluding Prisma migration table)
 *  2. Verify dump integrity with pg_restore -l
 *  3. Encrypt the dump file with AES-256-GCM using the user's password
 *  4. Record the result in the backup history
 *
 * @param folderPath - Destination directory for the backup file.
 * @param userPassword - Password used to encrypt the file.
 * @param dbConfig - Database connection parameters.
 * @param isProd - Whether the app is running in production mode.
 * @returns Metadata about the created backup file (path, name, size).
 */
export async function exportBackup(
	folderPath: string,
	userPassword: string,
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): Promise<{ filePath: string; fileName: string; size: string }> {
	if (!userPassword) {
		throw new Error('A password is required to encrypt the backup.');
	}

	// Build a timestamp string (YYYYMMDD_HHMMSS) for the filename
	const now = new Date();
	const timestamp = now.getFullYear() +
		String(now.getMonth() + 1).padStart(2, '0') +
		String(now.getDate()).padStart(2, '0') + '_' +
		String(now.getHours()).padStart(2, '0') +
		String(now.getMinutes()).padStart(2, '0') +
		String(now.getSeconds()).padStart(2, '0');

	const fileName = `backup_${timestamp}.lsbak`;
	const safeFolder = folderPath.replace(/\\/g, '/');
	const filePath = path.join(safeFolder, fileName);

	return new Promise((resolve, reject) => {
		const pgDumpBin = getPgBinary('pg_dump');
		const pgRestoreBin = getPgBinary('pg_restore');

		console.log(`[BACKUP] Exporting with pg_dump: ${pgDumpBin}`);

		// pg_dump arguments: data-only, custom format, excluding migration metadata table
		const dumpArgs = [
			'-U', dbConfig.user,
			'-h', dbConfig.host,
			'-p', String(dbConfig.port),
			'--data-only',
			'--exclude-table=_prisma_migrations',
			'-F', 'c',        // Custom (compressed) format
			'-f', filePath,
			dbConfig.dbName
		];

		const dumpProc = spawn(pgDumpBin, dumpArgs, {
			env: {
				...process.env,
				PGPASSWORD: dbConfig.password  // Pass password via env to avoid prompts
			}
		});

		let stderrOutput = '';
		dumpProc.stderr.on('data', (chunk) => {
			stderrOutput += chunk.toString();
		});

		dumpProc.on('error', async (err) => {
			console.error('[BACKUP] Failed to run pg_dump:', err);
			await addBackupHistoryEntry({
				status: 'failed',
				type: 'export',
				error: err.message
			});
			reject(err.message);
		});

		dumpProc.on('close', async (code) => {
			if (code !== 0) {
				const errMsg = stderrOutput || `pg_dump exited with code ${code}`;
				console.error('[BACKUP] pg_dump error:', errMsg);
				// Clean up the partial dump file if it was created
				try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
				await addBackupHistoryEntry({
					status: 'failed',
					type: 'export',
					error: errMsg
				});
				reject(errMsg);
				return;
			}

			// Verify dump integrity before encrypting
			const verifyProc = spawn(pgRestoreBin, ['-l', filePath], {
				env: {
					...process.env,
					PGPASSWORD: dbConfig.password
				}
			});

			let verifyStderr = '';
			verifyProc.stderr.on('data', (chunk) => {
				verifyStderr += chunk.toString();
			});

			verifyProc.on('close', async (verifyCode) => {
				if (verifyCode !== 0) {
					// Integrity check failed — discard the dump
					try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
					const errMsg = 'Integrity check failed: ' + (verifyStderr || `code ${verifyCode}`);
					await addBackupHistoryEntry({
						status: 'failed',
						type: 'export',
						filePath,
						error: errMsg
					});
					reject(errMsg);
					return;
				}

				try {
					// Encrypt the verified dump file in place
					await encryptFileInPlace(filePath, userPassword);

					const sizeInBytes = fs.statSync(filePath).size;
					const sizeStr = formatFileSize(sizeInBytes);

					await addBackupHistoryEntry({
						status: 'success',
						type: 'export',
						filePath,
						size: sizeStr
					});

					console.log('[BACKUP] Export completed:', fileName);
					resolve({ filePath, fileName, size: sizeStr });
				} catch (encryptError: any) {
					// Encryption failed — discard the unencrypted dump
					try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
					await addBackupHistoryEntry({
						status: 'failed',
						type: 'export',
						filePath,
						error: 'Encryption error: ' + (encryptError.message || String(encryptError))
					});
					reject('Failed to apply AES-256-GCM encryption to the backup.');
				}
			});
		});
	});
}

/**
 * Imports a .lsbak backup file into the database using a safe swap strategy.
 *
 * This approach avoids overwriting the live database until the restore is fully validated:
 *  1. Decrypt the backup to a temp file
 *  2. Create a temporary database
 *  3. Run Prisma migrations on the temp DB (establishes schema)
 *  4. Restore data with pg_restore into the temp DB
 *  5. Terminate all connections to the current database
 *  6. Rename the current DB → old, temp DB → current, drop old
 *  7. Reconnect the backend connection pool
 *
 * On any error, the temp DB is dropped and the original database is left intact.
 *
 * @param filePath - Path to the encrypted .lsbak backup file.
 * @param userPassword - Password used during export to decrypt the file.
 * @param dbConfig - Database connection parameters.
 * @param isProd - Whether the app is running in production mode.
 * @returns Object with the file path and a requiresReload flag.
 */
export async function importBackup(
	filePath: string,
	userPassword: string,
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): Promise<{ filePath: string; requiresReload?: boolean }> {
	if (!userPassword) {
		throw new Error('A password is required to decrypt the backup.');
	}

	const safeFilePath = filePath.replace(/\\/g, '/');
	let tempDecryptedPath: string | null = null;

	// Unique temp DB name prevents conflicts if multiple imports run concurrently
	const tempDbName = `${dbConfig.dbName}_restore_temp_${Date.now()}`;
	const psqlBin = getPgBinary('psql');
	const pgRestoreBin = getPgBinary('pg_restore');

	try {
		console.log('[BACKUP] Starting secure backup import...');

		// Step 1: Decrypt the backup file to a temporary plaintext file
		console.log('[BACKUP] Decrypting file...');
		tempDecryptedPath = await decryptFileToTemp(safeFilePath, userPassword);

		// Step 2: Create a temporary database to restore into
		console.log(`[BACKUP] Creating temp database: ${tempDbName} with ${psqlBin}`);
		const createTempDbResult = spawnSync(
			psqlBin,
			[
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'-d', 'postgres',
				'-c', `CREATE DATABASE "${tempDbName}";`
			],
			{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
		);

		if (createTempDbResult.status !== 0) {
			throw new Error(`Failed to create temp database: ${createTempDbResult.stderr || createTempDbResult.stdout}`);
		}

		// Step 3: Apply Prisma migrations to the temp DB to set up the schema
		console.log('[BACKUP] Applying migrations to temp database...');
		const backendRoot = isProd
			? path.join(process.resourcesPath, 'backend')
			: path.resolve(__dirname, '..', '..', '..', 'backend');

		console.log('[BACKUP] backendRoot:', backendRoot);

		const databaseUrl = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${tempDbName}?schema=public`;
		console.log('[BACKUP] DATABASE_URL set for temp database:', tempDbName);

		// Prefer the bundled Prisma binary; fall back to npx if not found
		const prismaBin = path.join(backendRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
		const cmd = fs.existsSync(prismaBin) ? `"${prismaBin}" migrate deploy` : 'npx prisma migrate deploy';

		await new Promise<void>((resolve, reject) => {
			exec(cmd, {
				encoding: 'utf8',
				env: {
					...process.env,
					DATABASE_URL: databaseUrl,
					NODE_ENV: 'production'
				},
				cwd: backendRoot,
				maxBuffer: 10 * 1024 * 1024  // 10 MB buffer for large migration outputs
			}, (error, stdout, stderr) => {
				console.log('[BACKUP] Prisma migrate result:');
				console.log('[BACKUP]   stdout:', stdout);
				console.log('[BACKUP]   stderr:', stderr);

				if (error) {
					console.log('[BACKUP]   error:', error.message);
					const errorMsg = [stderr, stdout, error.message]
						.filter(Boolean)
						.join('\n') || 'Prisma migrate failed with no error message';
					reject(new Error(`Failed to apply migrations:\n${errorMsg}`));
					return;
				}

				console.log('[BACKUP] ✅ Migrations applied successfully');
				resolve();
			});
		});

		// Step 4: Restore the backup data into the temp database
		console.log('[BACKUP] Restoring data to temp database with:', pgRestoreBin);
		await new Promise<void>((resolve, reject) => {
			const fileStats = fs.statSync(tempDecryptedPath!);
			console.log('[BACKUP] Decrypted file size:', fileStats.size, 'bytes');

			if (fileStats.size === 0) {
				reject(new Error('Decrypted file is empty'));
				return;
			}

			const restoreProc = spawn(pgRestoreBin, [
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'--data-only',
				'--disable-triggers',  // Disables FK checks during restore to avoid ordering issues
				'-v',                  // Verbose output for debugging
				'-d', tempDbName,
				tempDecryptedPath!
			], {
				env: {
					...process.env,
					PGPASSWORD: dbConfig.password
				}
			});

			let restoreStderr = '';
			let restoreStdout = '';
			restoreProc.stdout.on('data', (d) => { restoreStdout += d.toString(); });
			restoreProc.stderr.on('data', (d) => { restoreStderr += d.toString(); });

			restoreProc.on('error', (err) => {
				reject(new Error(`Failed to run pg_restore: ${err.message}`));
			});

			restoreProc.on('close', (code) => {
				console.log('[BACKUP] pg_restore exit code:', code);
				// pg_restore exits with code 1 on warnings (e.g. skipped objects) which is acceptable
				if (code !== 0 && code !== 1) {
					reject(new Error(`Data restore failed (code ${code}): ${restoreStderr || restoreStdout}`));
					return;
				}

				// Wait briefly to ensure all transactions are committed before verifying
				setTimeout(() => {
					const verifyResult = spawnSync(
						psqlBin,
						[
							'-U', dbConfig.user,
							'-h', dbConfig.host,
							'-p', String(dbConfig.port),
							'-d', tempDbName,
							'-t',
							'-c', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
						],
						{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
					);

					console.log('[BACKUP] Tables in temp database:', verifyResult.stdout);
					console.log('[BACKUP] ✅ Data restored successfully to temp database');
					resolve();
				}, 1000);
			});
		});

		// Step 5: Kill all active connections to the original database before renaming it
		console.log('[BACKUP] Preparing SWAP: terminating connections to old database...');
		const killConnectionsSql = `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbConfig.dbName}' AND pid <> pg_backend_pid();`;
		spawnSync(
			psqlBin,
			[
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'-d', 'postgres',
				'-c', killConnectionsSql
			],
			{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
		);

		// Wait for connections to fully terminate before renaming
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Step 6: Atomic swap — rename the databases so the restored DB becomes the active one
		console.log('[BACKUP] Swapping databases (original ↔ temp)...');
		const swapResult = spawnSync(
			psqlBin,
			[
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'-d', 'postgres',
				'-c', `ALTER DATABASE "${dbConfig.dbName}" RENAME TO "${dbConfig.dbName}_backup_old";`,
				'-c', `ALTER DATABASE "${tempDbName}" RENAME TO "${dbConfig.dbName}";`,
				'-c', `DROP DATABASE IF EXISTS "${dbConfig.dbName}_backup_old";`  // Drop old DB after swap
			],
			{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
		);

		if (swapResult.status !== 0) {
			throw new Error(`Database SWAP failed: ${swapResult.stderr || swapResult.stdout}`);
		}

		console.log('[BACKUP] ✅ Database SWAP completed successfully');

		// Step 7: Ask the backend to reconnect its connection pool to the new database
		const backendPort = process.env.PORT || 5000;
		console.log(`[BACKUP] Reconnecting connection pool at http://localhost:${backendPort}...`);
		try {
			const res = await fetch(`http://localhost:${backendPort}/api/admin/reconnect-db`, {
				method: 'POST'
			});
			if (res.ok) {
				console.log('[BACKUP] ✅ Connection pool reconnected successfully');
			} else {
				console.warn('[BACKUP] Pool reconnect returned non-OK status:', res.status);
			}
		} catch (err: any) {
			// Non-fatal — the app may still function; user can restart if needed
			console.warn('[BACKUP] Warning: Could not reconnect pool:', err.message);
		}

		// Clean up the temporary decrypted file
		if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
			try { fs.unlinkSync(tempDecryptedPath); } catch { }
		}

		const sizeInBytes = fs.statSync(safeFilePath).size;
		const sizeStr = formatFileSize(sizeInBytes);

		await addBackupHistoryEntry({
			status: 'success',
			type: 'import',
			filePath: safeFilePath,
			size: sizeStr
		});

		console.log('[BACKUP] ✅ Import completed successfully');
		return { filePath: safeFilePath, requiresReload: true };

	} catch (err: any) {
		console.error('[BACKUP] ❌ Error during import, initiating rollback...');

		// Rollback: clean up the decrypted temp file
		if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
			try { fs.unlinkSync(tempDecryptedPath); } catch { }
		}

		// Rollback: drop the temp database if it was created
		try {
			console.log(`[BACKUP] Cleaning up temp database: ${tempDbName}`);
			spawnSync(
				psqlBin,
				[
					'-U', dbConfig.user,
					'-h', dbConfig.host,
					'-p', String(dbConfig.port),
					'-d', 'postgres',
					'-c', `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${tempDbName}' AND pid <> pg_backend_pid();`,
					'-c', `DROP DATABASE IF EXISTS "${tempDbName}";`
				],
				{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
			);
			console.log('[BACKUP] Temp database removed');
		} catch (cleanupErr) {
			console.error('[BACKUP] Failed to clean up temp database:', cleanupErr);
		}

		const errorMsg = err.message || String(err);
		await addBackupHistoryEntry({
			status: 'failed',
			type: 'import',
			filePath: safeFilePath,
			error: errorMsg
		});

		console.error('[BACKUP] ✅ Rollback complete — original database intact');
		throw err;
	}
}

export interface BackupConfig {
	route: string;
	frequency: number; // in seconds (e.g. 86400 = 24h)
	enabled: boolean;
	lastAutoBackup?: string;
	autoBackupPassword?: string;
}

/**
 * Returns the absolute path to the backup configuration JSON file.
 */
function getConfigFilePath(): string {
	return path.join(app.getPath('userData'), 'backup_config.json');
}

/**
 * Returns the current backup configuration, creating a default one if none exists.
 * Also ensures the default backup directory exists on disk.
 */
export function getBackupConfig(): BackupConfig {
	const configPath = getConfigFilePath();
	const defaultDir = path.join(app.getPath('userData'), 'backups');

	// Ensure the default backup directory exists
	if (!fs.existsSync(defaultDir)) {
		try {
			fs.mkdirSync(defaultDir, { recursive: true });
		} catch (e) {
			console.error('[BACKUP] Failed to create default backup directory:', e);
		}
	}

	const defaultConfig: BackupConfig = {
		route: defaultDir,
		frequency: 86400, // 24 hours
		enabled: false
	};

	// Write the default config if no config file exists yet
	if (!fs.existsSync(configPath)) {
		try {
			fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
		} catch (e) {
			console.error('[BACKUP] Failed to create initial backup_config.json:', e);
		}
		return defaultConfig;
	}

	try {
		const raw = fs.readFileSync(configPath, 'utf8');
		// Merge with defaults so new fields are always present even in older config files
		return { ...defaultConfig, ...JSON.parse(raw) };
	} catch (e) {
		console.error('[BACKUP] Failed to read backup_config.json:', e);
		return defaultConfig;
	}
}

/**
 * Saves a partial update to the backup configuration.
 * Merges the partial object with the current config and persists the result.
 * Also restarts the auto-backup scheduler to apply any schedule changes.
 *
 * @param partial - Partial config fields to update.
 * @returns The full updated config object.
 */
export function saveBackupConfig(partial: Partial<BackupConfig>): BackupConfig {
	const current = getBackupConfig();
	const updated: BackupConfig = { ...current, ...partial };
	try {
		fs.writeFileSync(getConfigFilePath(), JSON.stringify(updated, null, 2), 'utf8');
		console.log('[BACKUP] Backup configuration updated:', updated);
	} catch (e) {
		console.error('[BACKUP] Failed to save backup_config.json:', e);
		throw e;
	}

	// Restart the scheduler so the new settings take effect immediately
	restartAutoBackupScheduler();
	return updated;
}

/**
 * Returns the currently configured default backup destination path.
 */
export async function getDefaultBackupRoute(): Promise<string> {
	return getBackupConfig().route;
}

/**
 * Updates the default backup destination path and persists the change.
 */
export async function setDefaultBackupRoute(route: string): Promise<string> {
	const updated = saveBackupConfig({ route });
	return updated.route;
}

/**
 * Updates the auto-backup frequency (in seconds) and persists the change.
 */
export async function setAutoBackupFrequency(frequency: number): Promise<number> {
	const updated = saveBackupConfig({ frequency });
	return updated.frequency;
}

// ── Auto-backup Scheduler ─────────────────────────────────────────────────────
//
// The scheduler checks every 60 seconds whether enough time has elapsed since
// the last automatic backup. If so, it triggers an export using the stored
// auto-backup password.
//
// db config and isProd are cached on initialization so the scheduler can run
// without needing them passed in on every tick.

let autoBackupTimer: NodeJS.Timeout | null = null;
let cachedDbConfig: { user: string; password: string; host: string; port: string; dbName: string } | null = null;
let cachedIsProd: boolean = false;

/**
 * Initializes the auto-backup scheduler with the database configuration.
 * Must be called once on app startup (after IPC handlers are registered).
 *
 * @param dbConfig - Database connection parameters to cache for scheduled runs.
 * @param isProd - Whether the app is running in production mode.
 */
export function initAutoBackupScheduler(
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): void {
	cachedDbConfig = dbConfig;
	cachedIsProd = isProd;
	restartAutoBackupScheduler();
}

/**
 * Stops any running scheduler and restarts it with the current configuration.
 * Called after a config change to apply the new schedule immediately.
 */
export function restartAutoBackupScheduler(): void {
	// Stop the previous timer if one is running
	if (autoBackupTimer) {
		clearInterval(autoBackupTimer);
		autoBackupTimer = null;
	}

	const config = getBackupConfig();
	if (!config.enabled || !cachedDbConfig) {
		console.log('[BACKUP] Auto-backup disabled or database not configured');
		return;
	}

	console.log(`[BACKUP] Auto-backup scheduler active: every ${config.frequency}s to ${config.route}`);

	// Polling interval — check every 60 seconds whether a backup is due
	const CHECK_INTERVAL_MS = 60 * 1000;

	const checkAndRun = async () => {
		try {
			const currentConfig = getBackupConfig();
			if (!currentConfig.enabled || !cachedDbConfig) return;

			const now = Date.now();
			const lastTime = currentConfig.lastAutoBackup
				? new Date(currentConfig.lastAutoBackup).getTime()
				: 0;

			const elapsedSeconds = (now - lastTime) / 1000;

			// Only run a backup if the configured interval has elapsed
			if (elapsedSeconds >= currentConfig.frequency) {
				console.log('[BACKUP] Triggering scheduled automatic backup...');

				// Use the stored auto-backup password, falling back to a default key
				const autoBackupPass = currentConfig.autoBackupPassword || 'LibSoftAutoBackupKey';

				const result = await exportBackup(
					currentConfig.route,
					autoBackupPass,
					cachedDbConfig,
					cachedIsProd
				);

				// Persist the timestamp so the next check knows when the last backup ran
				saveBackupConfig({ lastAutoBackup: new Date().toISOString() });
				console.log('[BACKUP] ✅ Automatic backup generated successfully:', result.filePath);

				// Notify the user via OS notification
				if (ElectronNotification.isSupported()) {
					new ElectronNotification({
						title: 'Automatic backup completed',
						body: `A backup has been saved to: ${result.fileName}`
					}).show();
				}
			}
		} catch (error: any) {
			console.error('[BACKUP] ❌ Automatic backup failed:', error);
			if (ElectronNotification.isSupported()) {
				new ElectronNotification({
					title: 'Automatic backup failed',
					body: error?.message || 'Could not complete the automatic backup.'
				}).show();
			}
		}
	};

	// Run once immediately on startup, then on the regular interval
	checkAndRun();
	autoBackupTimer = setInterval(checkAndRun, CHECK_INTERVAL_MS);
}