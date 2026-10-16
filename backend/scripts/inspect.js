const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'library',
});

async function main() {
    await pool.query('ALTER TABLE "public"."book_copies" ALTER COLUMN "book_id" SET DATA TYPE BIGINT;');
    console.log('book_copies.book_id changed to BIGINT successfully');
    await pool.end();
}

main().catch(console.error);
