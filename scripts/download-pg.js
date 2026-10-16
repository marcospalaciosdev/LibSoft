import fs from 'fs';
import path from 'path';
import https from 'https';
import extract from 'extract-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_URL = 'https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip';
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const PG_DIR = path.join(RESOURCES_DIR, 'pgsql');
const ZIP_PATH = path.join(RESOURCES_DIR, 'pgsql.zip');

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            if (response.statusCode !== 200) return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    if (fs.existsSync(PG_DIR)) return;
    if (!fs.existsSync(RESOURCES_DIR)) fs.mkdirSync(RESOURCES_DIR, { recursive: true });
    await downloadFile(PG_URL, ZIP_PATH);

    try {
        await extract(ZIP_PATH, { dir: RESOURCES_DIR });
    } catch (err) {
        console.error('Error extracting ZIP:', err);
    } finally {
        if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
    }
}

main().catch(console.error);
