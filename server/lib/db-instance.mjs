import Database from './database.mjs';

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export default getDatabase;
