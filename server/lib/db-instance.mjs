import Database from './database.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    console.log('🔧 Initialisation DB unique:', DB_PATH);
    dbInstance = new Database(DB_PATH);
  }
  return dbInstance;
}

export default getDatabase;
