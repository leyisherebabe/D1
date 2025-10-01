import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SupabaseDatabase {
  constructor() {
    console.log('✅ Supabase Database initialized');
  }

  // Utilisateurs
  async createUser(username, passwordHash, role = 'viewer', discordId = null, discordUsername = null, expiresAt = null) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        username,
        password_hash: passwordHash,
        role,
        discord_id: discordId,
        discord_username: discordUsername,
        expires_at: expiresAt,
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateUserLogin(username) {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('username', username);

    if (error) throw error;
  }

  // Utilisateurs connectés
  async addConnectedUser(userInfo) {
    const { data, error } = await supabase
      .from('connected_users')
      .upsert({
        id: userInfo.id,
        username: userInfo.username,
        ip_address: userInfo.ip,
        user_agent: userInfo.userAgent,
        fingerprint: userInfo.fingerprint,
        page: userInfo.page,
        connected_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) console.error('Error adding connected user:', error);
    return data;
  }

  async updateUserActivity(userId) {
    const { error } = await supabase
      .from('connected_users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', userId);

    if (error) console.error('Error updating user activity:', error);
  }

  async removeConnectedUser(userId) {
    const { error } = await supabase
      .from('connected_users')
      .delete()
      .eq('id', userId);

    if (error) console.error('Error removing connected user:', error);
  }

  async getConnectedUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('connected_users')
      .select('*')
      .gt('last_activity', fiveMinutesAgo);

    if (error) {
      console.error('Error getting connected users:', error);
      return [];
    }
    return data || [];
  }

  // Messages de chat
  async addChatMessage(message) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        username: message.username,
        message: message.text || message.message,
        role: message.role || 'viewer',
        is_system: message.isSystem || false,
        color: message.color,
        ip_address: message.ip,
        fingerprint: message.fingerprint,
        stream_id: message.streamKey || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding chat message:', error);
      return null;
    }
    return data;
  }

  async getChatMessages(limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
    return data || [];
  }

  // Bans
  async isUserBanned(fingerprint, ip) {
    const { data, error } = await supabase
      .from('banned_users')
      .select('*')
      .or(`fingerprint.eq.${fingerprint},ip_address.eq.${ip}`)
      .or('is_permanent.eq.true,ban_end_time.gt.' + new Date().toISOString())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking ban:', error);
    }
    return data;
  }

  async banUser(fingerprint, ip, username, reason, bannedBy, isPermanent = true, banEndTime = null) {
    const { data, error } = await supabase
      .from('banned_users')
      .insert({
        fingerprint,
        ip_address: ip,
        username,
        reason,
        banned_by: bannedBy,
        is_permanent: isPermanent,
        ban_end_time: banEndTime
      })
      .select()
      .single();

    if (error) {
      console.error('Error banning user:', error);
      return null;
    }
    return data;
  }

  // Mutes
  async isUserMuted(fingerprint) {
    const { data, error } = await supabase
      .from('muted_users')
      .select('*')
      .eq('fingerprint', fingerprint)
      .gt('mute_end_time', new Date().toISOString())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking mute:', error);
    }
    return data;
  }

  async muteUser(fingerprint, username, ip, reason, mutedBy, muteEndTime, muteCount = 1) {
    const { data, error } = await supabase
      .from('muted_users')
      .insert({
        fingerprint,
        username,
        ip_address: ip,
        reason,
        muted_by: mutedBy,
        mute_end_time: muteEndTime,
        mute_count: muteCount
      })
      .select()
      .single();

    if (error) {
      console.error('Error muting user:', error);
      return null;
    }
    return data;
  }

  async getMuteCount(fingerprint) {
    const { data, error } = await supabase
      .from('muted_users')
      .select('mute_count')
      .eq('fingerprint', fingerprint)
      .order('muted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return 0;
    return data ? data.mute_count : 0;
  }

  // Streams
  async createStream(streamKey, title, description = '', thumbnail = '') {
    const { data, error } = await supabase
      .from('streams')
      .insert({
        stream_key: streamKey,
        title,
        description,
        thumbnail,
        is_live: true,
        viewer_count: 0,
        start_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stream:', error);
      return null;
    }
    return data;
  }

  async updateStreamStatus(streamKey, isLive) {
    const updates = { is_live: isLive };
    if (!isLive) {
      updates.end_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('streams')
      .update(updates)
      .eq('stream_key', streamKey);

    if (error) console.error('Error updating stream status:', error);
  }

  async updateStreamViewers(streamKey, viewerCount) {
    const { data: stream } = await supabase
      .from('streams')
      .select('peak_viewers')
      .eq('stream_key', streamKey)
      .single();

    const updates = { viewer_count: viewerCount };
    if (!stream || viewerCount > (stream.peak_viewers || 0)) {
      updates.peak_viewers = viewerCount;
    }

    const { error } = await supabase
      .from('streams')
      .update(updates)
      .eq('stream_key', streamKey);

    if (error) console.error('Error updating stream viewers:', error);
  }

  // Logs d'activité
  async addActivityLog(actionType, details, severity = 'low', username = '', ip = '', fingerprint = '', adminUsername = '') {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action_type: actionType,
        username,
        ip_address: ip,
        fingerprint,
        details: typeof details === 'string' ? { message: details } : details,
        severity,
        admin_username: adminUsername
      });

    if (error) console.error('Error adding activity log:', error);
  }

  // Cleanup
  async cleanupExpiredAccounts() {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    if (error) console.error('Error cleaning expired accounts:', error);
  }

  async cleanupOldConnections() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('connected_users')
      .delete()
      .lt('last_activity', tenMinutesAgo);

    if (error) console.error('Error cleaning old connections:', error);
  }
}

export default SupabaseDatabase;
