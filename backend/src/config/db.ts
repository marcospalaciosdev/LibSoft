import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: false });

function getPoolConfig(): PoolConfig {
    return {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
    };
}

let activePool = new Pool(getPoolConfig());

function attachPoolHandlers(p: Pool) {
    p.on('connect', () => {
        void p.query("SET TIME ZONE 'UTC'");
    });

    p.on('error', (err) => {
        console.warn('[DB] Error en cliente del pool:', err?.message || err);
    });
}

attachPoolHandlers(activePool);

export const query = (text: string, params?: any[]) => {
    return activePool.query(text, params);
};

/**
 * Reconecta el pool de conexiones (útil después de SWAP de bases de datos)
 */
export async function reconnectPool() {
    try {
        console.log('[DB] Reconectando pool de conexiones...');
        const oldPool = activePool;

        const newPool = new Pool(getPoolConfig());
        attachPoolHandlers(newPool);

        // Verificar que el nuevo pool se conecta correctamente
        await newPool.query('SELECT 1');

        // Reemplazar la referencia activa para que el Proxy use el nuevo pool inmediatamente
        activePool = newPool;
        console.log('[DB] ✅ Pool reconectado exitosamente');

        // Cerrar el pool viejo en segundo plano de manera segura
        setTimeout(async () => {
            try {
                await oldPool.end();
            } catch (e: any) {
                console.warn('[DB] Advertencia al cerrar pool anterior:', e?.message || e);
            }
        }, 500);
    } catch (error) {
        console.error('[DB] Error al reconectar pool:', error);
        throw error;
    }
}

// Proxy transparente para que cualquier módulo o middleware (como connect-pg-simple)
// que guarde la referencia inicial al pool use siempre activePool actualizado
const poolProxy = new Proxy({} as Pool, {
    get(_target, prop, receiver) {
        const val = Reflect.get(activePool, prop);
        if (typeof val === 'function') {
            return val.bind(activePool);
        }
        return val;
    },
    set(_target, prop, value) {
        return Reflect.set(activePool, prop, value);
    },
    has(_target, prop) {
        return Reflect.has(activePool, prop);
    }
});

export default poolProxy;
