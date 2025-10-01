import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string;
  role: 'viewer' | 'moderator' | 'admin';
  created_at: string;
  last_login: string;
}

export interface Stream {
  id: string;
  stream_key: string;
  title: string;
  description: string;
  thumbnail: string;
  start_time: string;
  end_time: string | null;
  is_live: boolean;
  rtmp_url: string;
  hls_url: string;
  viewer_count: number;
  created_by: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  stream_id: string | null;
  user_id: string | null;
  username: string;
  message: string;
  ip_address: string;
  fingerprint: string;
  created_at: string;
}

export interface ConnectedUser {
  id: string;
  user_id: string | null;
  username: string;
  ip_address: string;
  user_agent: string;
  fingerprint: string;
  page: string;
  connected_at: string;
  last_activity: string;
}

export interface BannedUser {
  id: string;
  fingerprint: string;
  ip_address: string;
  username: string;
  reason: string;
  banned_at: string;
  banned_by: string;
  is_permanent: boolean;
  ban_end_time: string | null;
}

export interface MutedUser {
  id: string;
  fingerprint: string;
  username: string;
  ip_address: string;
  reason: string;
  muted_at: string;
  muted_by: string;
  mute_end_time: string | null;
  mute_count: number;
}
