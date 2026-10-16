import { spawnSync } from 'child_process';
import path from 'path';
import { disconnectSeedClient, seedReferenceData } from './prisma/seed';

function runMigrations() {
  // 1. Calculamos la ruta absoluta de la carpeta 'backend'
  // Como bootstrap.ts está en backend/src/db/, retrocedemos dos niveles ('..', '..')
  const backendPath = path.resolve(__dirname, '..', '..');

  // 2. Apuntamos al binario de prisma local del backend
  const prismaBin = path.resolve(backendPath, 'node_modules', '.bin', 'prisma');

  const result = spawnSync(prismaBin, ['migrate', 'deploy'], {
    cwd: backendPath, // 👈 CRUCIAL: Fuerza a Prisma a ejecutarse DENTRO de la carpeta backend
    encoding: 'utf8',
    env: { ...process.env },
    shell: process.platform === 'win32',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error(`prisma migrate deploy failed with exit code ${result.status}`);
  }
}

let bootstrapPromise: Promise<void> | null = null;

export async function ensureDatabaseReady() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        runMigrations();
        await seedReferenceData();
      } finally {
        await disconnectSeedClient();
      }
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

if (require.main === module) {
  ensureDatabaseReady()
    .then(() => {
      console.log('Database bootstrap completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database bootstrap failed:', error);
      process.exit(1);
    });
}
