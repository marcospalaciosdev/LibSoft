import { app, Notification as ElectronNotification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec, spawnSync, spawn } from 'child_process';
import { encryptFileInPlace, decryptFileToTemp } from './crypto';
import { getPgBinary } from './postgres';

const MAX_HISTORY_ENTRIES = 500;

export interface BackupHistoryEntry {
	date: string;
	size?: string;
	status: 'success' | 'failed';
	type: 'export' | 'import';
	filePath?: string;
	exists?: boolean;
	error?: string;
}

function getHistoryPath(): string {
	return path.join(app.getPath('userData'), 'backup_history.json');
}

export function readBackupHistory(): BackupHistoryEntry[] {
	const historyPath = getHistoryPath();
	if (!fs.existsSync(historyPath)) {
		return [];
	}

	try {
		const data = fs.readFileSync(historyPath, 'utf8');
		const entries: BackupHistoryEntry[] = JSON.parse(data);

		if (!Array.isArray(entries)) return [];

		return entries.map((entry) => ({
			...entry,
			exists: entry.filePath ? fs.existsSync(entry.filePath) : false
		}));
	} catch (e) {
		console.error('[BACKUP] Error al leer historial:', e);
		return [];
	}
}

export async function addBackupHistoryEntry(
	entry: Omit<BackupHistoryEntry, 'date' | 'exists'>
): Promise<void> {
	try {
		const history = readBackupHistory();

		const newEntry: BackupHistoryEntry = {
			...entry,
			date: new Date().toISOString(),
		};

		history.unshift(newEntry);

		if (history.length > MAX_HISTORY_ENTRIES) {
			history.length = MAX_HISTORY_ENTRIES;
		}

		const cleanHistory = history.map(({ exists, ...rest }) => rest);
		const historyPath = getHistoryPath();
		const tempPath = `${historyPath}.tmp`;
		const jsonContent = JSON.stringify(cleanHistory, null, 2);

		await fs.promises.writeFile(tempPath, jsonContent, 'utf8');
		await fs.promises.rename(tempPath, historyPath);

		console.log('[BACKUP] Entrada agregada al historial');
	} catch (e) {
		console.error('[BACKUP] Error al guardar historial:', e);
	}
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function exportBackup(
	folderPath: string,
	userPassword: string,
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): Promise<{ filePath: string; fileName: string; size: string }> {
	if (!userPassword) {
		throw new Error('Se requiere contraseña para cifrar el backup.');
	}

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

		console.log(`[BACKUP] Exportando con pg_dump: ${pgDumpBin}`);

		const dumpArgs = [
			'-U', dbConfig.user,
			'-h', dbConfig.host,
			'-p', String(dbConfig.port),
			'--data-only',
			'--exclude-table=_prisma_migrations',
			'-F', 'c',
			'-f', filePath,
			dbConfig.dbName
		];

		const dumpProc = spawn(pgDumpBin, dumpArgs, {
			env: {
				...process.env,
				PGPASSWORD: dbConfig.password
			}
		});

		let stderrOutput = '';
		dumpProc.stderr.on('data', (chunk) => {
			stderrOutput += chunk.toString();
		});

		dumpProc.on('error', async (err) => {
			console.error('[BACKUP] Error al ejecutar pg_dump:', err);
			await addBackupHistoryEntry({
				status: 'failed',
				type: 'export',
				error: err.message
			});
			reject(err.message);
		});

		dumpProc.on('close', async (code) => {
			if (code !== 0) {
				const errMsg = stderrOutput || `pg_dump falló con código ${code}`;
				console.error('[BACKUP] Error en pg_dump:', errMsg);
				try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
				await addBackupHistoryEntry({
					status: 'failed',
					type: 'export',
					error: errMsg
				});
				reject(errMsg);
				return;
			}

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
					try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
					const errMsg = 'Verificación de integridad fallida: ' + (verifyStderr || `código ${verifyCode}`);
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
					await encryptFileInPlace(filePath, userPassword);

					const sizeInBytes = fs.statSync(filePath).size;
					const sizeStr = formatFileSize(sizeInBytes);

					await addBackupHistoryEntry({
						status: 'success',
						type: 'export',
						filePath,
						size: sizeStr
					});

					console.log('[BACKUP] Export completado:', fileName);
					resolve({ filePath, fileName, size: sizeStr });
				} catch (encryptError: any) {
					try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
					await addBackupHistoryEntry({
						status: 'failed',
						type: 'export',
						filePath,
						error: 'Error al cifrar: ' + (encryptError.message || String(encryptError))
					});
					reject('Error al aplicar el cifrado AES-256-GCM al backup.');
				}
			});
		});
	});
}

export async function importBackup(
	filePath: string,
	userPassword: string,
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): Promise<{ filePath: string; requiresReload?: boolean }> {
	if (!userPassword) {
		throw new Error('Se requiere contraseña para descifrar el backup.');
	}

	const safeFilePath = filePath.replace(/\\/g, '/');
	let tempDecryptedPath: string | null = null;
	const tempDbName = `${dbConfig.dbName}_restore_temp_${Date.now()}`;
	const psqlBin = getPgBinary('psql');
	const pgRestoreBin = getPgBinary('pg_restore');

	try {
		console.log('[BACKUP] Iniciando importación segura del backup...');

		console.log('[BACKUP] Descifrando archivo...');
		tempDecryptedPath = await decryptFileToTemp(safeFilePath, userPassword);

		console.log(`[BACKUP] Creando BD temporal: ${tempDbName} con ${psqlBin}`);
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
			throw new Error(`Error al crear BD temporal: ${createTempDbResult.stderr || createTempDbResult.stdout}`);
		}

		console.log('[BACKUP] Aplicando migraciones en BD temporal...');
		const backendRoot = isProd
			? path.join(process.resourcesPath, 'backend')
			: path.resolve(__dirname, '..', '..', '..', 'backend');

		console.log('[BACKUP] backendRoot:', backendRoot);

		const databaseUrl = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${tempDbName}?schema=public`;
		console.log('[BACKUP] DATABASE_URL configurada para BD temporal:', tempDbName);

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
				maxBuffer: 10 * 1024 * 1024
			}, (error, stdout, stderr) => {
				console.log('[BACKUP] Prisma migrate resultado:');
				console.log('[BACKUP]   stdout:', stdout);
				console.log('[BACKUP]   stderr:', stderr);

				if (error) {
					console.log('[BACKUP]   error:', error.message);
					const errorMsg = [stderr, stdout, error.message]
						.filter(Boolean)
						.join('\n') || 'Prisma migrate falló sin mensaje de error';
					reject(new Error(`Error al aplicar migraciones:\n${errorMsg}`));
					return;
				}

				console.log('[BACKUP] ✅ Migraciones aplicadas exitosamente');
				resolve();
			});
		});

		console.log('[BACKUP] Restaurando datos en BD temporal con:', pgRestoreBin);
		await new Promise<void>((resolve, reject) => {
			const fileStats = fs.statSync(tempDecryptedPath!);
			console.log('[BACKUP] Archivo descifrado tamaño:', fileStats.size, 'bytes');

			if (fileStats.size === 0) {
				reject(new Error('El archivo descifrado está vacío'));
				return;
			}

			const restoreProc = spawn(pgRestoreBin, [
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'--data-only',
				'--disable-triggers',
				'-v',
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
				reject(new Error(`Error al ejecutar pg_restore: ${err.message}`));
			});

			restoreProc.on('close', (code) => {
				console.log('[BACKUP] pg_restore resultado: code', code);
				if (code !== 0 && code !== 1) {
					reject(new Error(`Error al restaurar datos (código ${code}): ${restoreStderr || restoreStdout}`));
					return;
				}

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

					console.log('[BACKUP] Tablas en BD temporal:', verifyResult.stdout);
					console.log('[BACKUP] ✅ Datos restaurados exitosamente en BD temporal');
					resolve();
				}, 1000);
			});
		});

		console.log('[BACKUP] Preparando SWAP: matando conexiones a BD vieja...');

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

		await new Promise(resolve => setTimeout(resolve, 1000));

		console.log('[BACKUP] Intercambiando BDs (original ↔ temporal)...');
		const swapResult = spawnSync(
			psqlBin,
			[
				'-U', dbConfig.user,
				'-h', dbConfig.host,
				'-p', String(dbConfig.port),
				'-d', 'postgres',
				'-c', `ALTER DATABASE "${dbConfig.dbName}" RENAME TO "${dbConfig.dbName}_backup_old";`,
				'-c', `ALTER DATABASE "${tempDbName}" RENAME TO "${dbConfig.dbName}";`,
				'-c', `DROP DATABASE IF EXISTS "${dbConfig.dbName}_backup_old";`
			],
			{ encoding: 'utf8', env: { ...process.env, PGPASSWORD: dbConfig.password } }
		);

		if (swapResult.status !== 0) {
			throw new Error(`Error al hacer SWAP de BDs: ${swapResult.stderr || swapResult.stdout}`);
		}

		console.log('[BACKUP] ✅ SWAP completado exitosamente');

		const backendPort = process.env.PORT || 5000;
		console.log(`[BACKUP] Reconectando pool de conexiones en http://localhost:${backendPort}...`);
		try {
			const res = await fetch(`http://localhost:${backendPort}/api/admin/reconnect-db`, {
				method: 'POST'
			});
			if (res.ok) {
				console.log('[BACKUP] ✅ Pool reconectado exitosamente');
			} else {
				console.warn('[BACKUP] Pool no se reconectó (status', res.status, ')');
			}
		} catch (err: any) {
			console.warn('[BACKUP] Advertencia: No se pudo reconectar pool:', err.message);
		}

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

		console.log('[BACKUP] ✅ Importación completada exitosamente');
		return { filePath: safeFilePath, requiresReload: true };

	} catch (err: any) {
		console.error('[BACKUP] ❌ Error durante la importación, iniciando rollback...');

		if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
			try { fs.unlinkSync(tempDecryptedPath); } catch { }
		}

		try {
			console.log(`[BACKUP] Limpiando BD temporal: ${tempDbName}`);
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
			console.log('[BACKUP] BD temporal eliminada');
		} catch (cleanupErr) {
			console.error('[BACKUP] Error al limpiar BD temporal:', cleanupErr);
		}

		const errorMsg = err.message || String(err);
		await addBackupHistoryEntry({
			status: 'failed',
			type: 'import',
			filePath: safeFilePath,
			error: errorMsg
		});

		console.error('[BACKUP] ✅ ROLLBACK completado - BD original intacta');
		throw err;
	}
}

export interface BackupConfig {
	route: string;
	frequency: number; // en segundos (ej. 86400 = 24h)
	enabled: boolean;
	lastAutoBackup?: string;
	autoBackupPassword?: string;
}

function getConfigFilePath(): string {
	return path.join(app.getPath('userData'), 'backup_config.json');
}

/**
 * Obtiene la configuración de backups (crea una por defecto si no existe)
 */
export function getBackupConfig(): BackupConfig {
	const configPath = getConfigFilePath();
	const defaultDir = path.join(app.getPath('userData'), 'backups');

	if (!fs.existsSync(defaultDir)) {
		try {
			fs.mkdirSync(defaultDir, { recursive: true });
		} catch (e) {
			console.error('[BACKUP] Error al crear directorio default de backups:', e);
		}
	}

	const defaultConfig: BackupConfig = {
		route: defaultDir,
		frequency: 86400, // 24 horas
		enabled: false
	};

	if (!fs.existsSync(configPath)) {
		try {
			fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
		} catch (e) {
			console.error('[BACKUP] Error al crear backup_config.json inicial:', e);
		}
		return defaultConfig;
	}

	try {
		const raw = fs.readFileSync(configPath, 'utf8');
		return { ...defaultConfig, ...JSON.parse(raw) };
	} catch (e) {
		console.error('[BACKUP] Error al leer backup_config.json:', e);
		return defaultConfig;
	}
}

/**
 * Guarda o actualiza la configuración de backups
 */
export function saveBackupConfig(partial: Partial<BackupConfig>): BackupConfig {
	const current = getBackupConfig();
	const updated: BackupConfig = { ...current, ...partial };
	try {
		fs.writeFileSync(getConfigFilePath(), JSON.stringify(updated, null, 2), 'utf8');
		console.log('[BACKUP] Configuración de backup actualizada:', updated);
	} catch (e) {
		console.error('[BACKUP] Error al guardar backup_config.json:', e);
		throw e;
	}

	restartAutoBackupScheduler();
	return updated;
}

export async function getDefaultBackupRoute(): Promise<string> {
	return getBackupConfig().route;
}

export async function setDefaultBackupRoute(route: string): Promise<string> {
	const updated = saveBackupConfig({ route });
	return updated.route;
}

export async function setAutoBackupFrequency(frequency: number): Promise<number> {
	const updated = saveBackupConfig({ frequency });
	return updated.frequency;
}

// ── Planificador (Scheduler) de Backups Automáticos ──────────────
let autoBackupTimer: NodeJS.Timeout | null = null;
let cachedDbConfig: { user: string; password: string; host: string; port: string; dbName: string } | null = null;
let cachedIsProd: boolean = false;

export function initAutoBackupScheduler(
	dbConfig: { user: string; password: string; host: string; port: string; dbName: string },
	isProd: boolean
): void {
	cachedDbConfig = dbConfig;
	cachedIsProd = isProd;
	restartAutoBackupScheduler();
}

export function restartAutoBackupScheduler(): void {
	if (autoBackupTimer) {
		clearInterval(autoBackupTimer);
		autoBackupTimer = null;
	}

	const config = getBackupConfig();
	if (!config.enabled || !cachedDbConfig) {
		console.log('[BACKUP] Auto-backup deshabilitado o BD no configurada');
		return;
	}

	console.log(`[BACKUP] Auto-backup scheduler activo: cada ${config.frequency}s hacia ${config.route}`);

	// Verificación periódica cada 60 segundos
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

			if (elapsedSeconds >= currentConfig.frequency) {
				console.log('[BACKUP] Disparando backup automático programado...');

				const autoBackupPass = currentConfig.autoBackupPassword || 'LibSoftAutoBackupKey';

				const result = await exportBackup(
					currentConfig.route,
					autoBackupPass,
					cachedDbConfig,
					cachedIsProd
				);

				saveBackupConfig({ lastAutoBackup: new Date().toISOString() });
				console.log('[BACKUP] ✅ Backup automático generado exitosamente:', result.filePath);

				if (ElectronNotification.isSupported()) {
					new ElectronNotification({
						title: 'Backup automático completado',
						body: `Se ha generado una copia de seguridad en: ${result.fileName}`
					}).show();
				}
			}
		} catch (error: any) {
			console.error('[BACKUP] ❌ Error en ejecución de backup automático:', error);
			if (ElectronNotification.isSupported()) {
				new ElectronNotification({
					title: 'Error en backup automático',
					body: error?.message || 'No se pudo completar el backup automático.'
				}).show();
			}
		}
	};

	checkAndRun();
	autoBackupTimer = setInterval(checkAndRun, CHECK_INTERVAL_MS);
}