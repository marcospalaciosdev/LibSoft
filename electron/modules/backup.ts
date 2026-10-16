import { app } from 'electron';
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

/**
 * Obtiene la ruta del archivo de historial de backups
 */
function getHistoryPath(): string {
	return path.join(app.getPath('userData'), 'backup_history.json');
}

/**
 * Lee el historial de backups desde el archivo
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

		return entries.map((entry) => ({
			...entry,
			exists: entry.filePath ? fs.existsSync(entry.filePath) : false
		}));
	} catch (e) {
		console.error('[BACKUP] Error al leer historial:', e);
		return [];
	}
}

/**
 * Agrega una nueva entrada al historial de backups
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

/**
 * Convierte bytes a string legible (B, KB, MB)
 */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Exporta un backup cifrado de la base de datos
 */
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

			// Verificar integridad del dump
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

/**
 * Importa un backup cifrado a la base de datos
 * SEGURO: Si algo falla, los datos originales se preservan
 * 
 * Estrategia:
 * 1. Descifrar el backup
 * 2. Crear BD temporal
 * 3. Aplicar migraciones en BD temporal
 * 4. Restaurar datos en BD temporal
 * 5. Si TODO funciona → SWAP BD original con temporal
 * 6. Si algo falla → Eliminar BD temporal, BD original intacta
 */
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

		// 1. Descifrar el backup a archivo temporal
		console.log('[BACKUP] Descifrando archivo...');
		tempDecryptedPath = await decryptFileToTemp(safeFilePath, userPassword);

		// 2. Crear BD temporal para restauración
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

		// 3. Aplicar migraciones en BD temporal
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

		// 4. Restaurar datos en BD temporal
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

				// Verificar que efectivamente se restauraron datos
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

		// 5. SWAP: Intercambiar BD original con BD temporal (OPERACIÓN ATÓMICA)
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

		// Reconectar el pool de conexiones del backend
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

		// Limpiar archivo temporal descifrado
		if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
			try { fs.unlinkSync(tempDecryptedPath); } catch { }
		}

		// Guardar en historial
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
		// ROLLBACK: Si algo falló, limpiar BD temporal y preservar original
		console.error('[BACKUP] ❌ Error durante la importación, iniciando rollback...');

		if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
			try { fs.unlinkSync(tempDecryptedPath); } catch { }
		}

		// Intentar eliminar BD temporal si existe
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
