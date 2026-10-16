import express from 'express';
import pool, { reconnectPool } from './config/db';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bookRoutes from './modules/books/bookRoutes';
import borrowerRoutes from './modules/borrowers/borrowerRoutes';
import loanRoutes from './modules/loans/loanRoutes';
import geoRoutes from './modules/geo/geoRoutes';
import helpRoutes from './modules/help/helpRoutes';
import authRoutes from './modules/auth/authRoutes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import metadataRoutes from './modules/metadata/metadata.routes';
import maintenanceRoutes from './modules/maintenance/maintenanceRoutes';
import auditRoutes from './modules/audit/audit.routes';
import languagesRoutes from './modules/languages/languagesRoutes';
import { authenticateSession } from './middleware/auth.middleware';

import { ensureDatabaseReady } from './db/bootstrap';
import { SESSION_SECRET } from './config/config';
import { auditMiddleware } from './modules/audit/audit.middleware';

dotenv.config({ override: false });

const app = express();
const PgSession = connectPgSimple(session);

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(session({
    store: new PgSession({
        pool,
        createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
}));

const PORT = process.env.PORT || 4000;

app.use('/api/auth', authRoutes);
app.use(auditMiddleware);

app.use('/api/books', bookRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/faqs', helpRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/languages', languagesRoutes);
app.use('/api/audit', auditRoutes);

app.post('/api/admin/reconnect-db', async (req, res) => {
    try {
        console.log('[API] Reconectando pool de conexiones...');
        await reconnectPool();
        res.json({ success: true, message: 'Pool reconectado' });
    } catch (error: any) {
        console.error('[API] Error al reconectar pool:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: '¡Backend funcionando y escuchando peticiones!' });
});

export async function startServer(port?: number) {
    const serverPort = port || process.env.PORT || 4000;

    return new Promise((resolve, reject) => {
        const server = app.listen(serverPort, async () => {

            try {
                const res = await pool.query('SELECT NOW()');
                await ensureDatabaseReady();
                resolve(server);
            } catch (err) {
                console.error('Error al conectar la DB al inicio:', err);
                reject(err);
            }
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
}


if (!process.env.ELECTRON_RUN) {
    if (require.main === module || process.argv[1].endsWith('app.ts') || process.argv[1].endsWith('app.js')) {
        startServer();
    }
}