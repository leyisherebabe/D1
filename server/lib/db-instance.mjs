import SupabaseDatabase from './supabase-db.mjs';

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    console.log('✅ Initialisation Supabase Database');
    dbInstance = new SupabaseDatabase();
  }
  return dbInstance;
}

export default getDatabase;
