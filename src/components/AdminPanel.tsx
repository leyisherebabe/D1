import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, Users, Activity, Settings, Ban, VolumeX, Trash2, Eye, Crown, Search,
  Clock, AlertTriangle, UserX, MessageSquare, Download, Filter, RefreshCw,
  TrendingUp, BarChart3, Zap, Globe, Terminal, Lock, Unlock, AlertCircle,
  CheckCircle, XCircle, Play, Pause, Radio, Video, UserCheck, UserPlus,
  Calendar, Server, Database, Wifi, WifiOff, Info, FileText, Mail
} from 'lucide-react';
import { ConnectedUser, ChatMessage, StreamSource } from '../types';
import { formatTime } from '../utils';

interface AdminPanelProps {
  currentUser: any;
  connectedUsers: ConnectedUser[];
  chatMessages: ChatMessage[];
  wsService: any;
  onStreamSourceChange: (source: StreamSource | null) => void;
}

interface ActivityLog {
  id: string | number;
  action_type: string;
  username: string;
  ip_address: string;
  fingerprint: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  admin_username: string;
  created_at: string;
}

interface BannedUser {
  id: number;
  fingerprint: string;
  ip: string;
  username: string;
  reason: string;
  banned_at: string;
  banned_by: string;
  is_permanent: boolean;
}

interface MutedUser {
  id: number;
  fingerprint: string;
  username: string;
  ip: string;
  reason: string;
  muted_at: string;
  mute_end_time: string;
  muted_by: string;
  mute_count: number;
}

interface StreamStats {
  totalViews: number;
  peakViewers: number;
  avgDuration: number;
  totalStreams: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  connectedUsers,
  chatMessages,
  wsService,
  onStreamSourceChange
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'moderation' | 'logs' | 'streams' | 'settings'>('dashboard');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [streamStats, setStreamStats] = useState<StreamStats>({
    totalViews: 0,
    peakViewers: 0,
    avgDuration: 0,
    totalStreams: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Synchronisation en temps réel
  useEffect(() => {
    if (!wsService?.ws) return;

    const handleWSMessage = (data: any) => {
      switch (data.type) {
        case 'user_list':
        case 'user_connected':
        case 'user_disconnected':
          fetchAllData();
          break;
        case 'chat_message':
          fetchActivityLogs();
          break;
      }
    };

    if (wsService.ws) {
      const originalOnMessage = wsService.ws.onmessage;
      wsService.ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
        if (originalOnMessage) {
          originalOnMessage.call(wsService.ws, event);
        }
      };
    }
  }, [wsService]);

  // Auto-refresh des données
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 5000); // Refresh toutes les 5 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchActivityLogs(),
      fetchBannedUsers(),
      fetchMutedUsers()
    ]);
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logs');
      const data = await response.json();
      if (data.success && data.logs) {
        setActivityLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, []);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/banned');
      const data = await response.json();
      if (data.success && data.banned) {
        setBannedUsers(data.banned);
      }
    } catch (err) {
      console.error('Error fetching banned users:', err);
    }
  }, []);

  const fetchMutedUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/muted');
      const data = await response.json();
      if (data.success && data.muted) {
        setMutedUsers(data.muted);
      }
    } catch (err) {
      console.error('Error fetching muted users:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const logAction = useCallback(async (
    actionType: string,
    username: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    try {
      await fetch('http://localhost:3001/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          username,
          ip_address: details.ip || '',
          fingerprint: details.fingerprint || '',
          details,
          severity,
          admin_username: currentUser?.username || 'admin'
        })
      });
      await fetchActivityLogs();
    } catch (err) {
      console.error('Error logging action:', err);
    }
  }, [currentUser, fetchActivityLogs]);

  const handleBanUser = async (user: ConnectedUser) => {
    const reason = prompt('Raison du ban:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: user.fingerprint,
          ip: user.ip,
          username: user.username,
          reason,
          bannedBy: currentUser?.username || 'admin',
          isPermanent: true
        })
      });

      const data = await response.json();
      if (data.success) {
        wsService?.send({ type: 'ban_user', fingerprint: user.fingerprint });
        await fetchAllData();
        alert('✅ Utilisateur banni avec succès');
      } else {
        alert('❌ Erreur lors du ban');
      }
    } catch (err) {
      console.error('Error banning user:', err);
      alert('❌ Erreur lors du ban');
    }
    setIsLoading(false);
  };

  const handleMuteUser = async (user: ConnectedUser) => {
    const durationMin = prompt('Durée du mute (en minutes):');
    if (!durationMin) return;

    const duration = parseInt(durationMin);
    if (isNaN(duration) || duration <= 0) {
      alert('Durée invalide');
      return;
    }

    const reason = prompt('Raison du mute:') || 'Aucune raison';

    setIsLoading(true);
    try {
      const muteEndTime = new Date(Date.now() + duration * 60000);

      const response = await fetch('http://localhost:3001/api/admin/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: user.fingerprint,
          username: user.username,
          ip: user.ip,
          muteEndTime: muteEndTime.toISOString(),
          reason,
          mutedBy: currentUser?.username || 'admin',
          duration: `${duration}min`
        })
      });

      const data = await response.json();
      if (data.success) {
        wsService?.send({
          type: 'mute_user',
          fingerprint: user.fingerprint,
          duration: duration * 60000
        });
        await fetchAllData();
        alert('✅ Utilisateur mute avec succès');
      } else {
        alert('❌ Erreur lors du mute');
      }
    } catch (err) {
      console.error('Error muting user:', err);
      alert('❌ Erreur lors du mute');
    }
    setIsLoading(false);
  };

  const handleKickUser = async (user: ConnectedUser) => {
    if (!confirm(`Expulser ${user.username} ?`)) return;

    setIsLoading(true);
    try {
      wsService?.send({ type: 'kick_user', fingerprint: user.fingerprint });
      await logAction('USER_KICKED', user.username, {
        ip: user.ip,
        fingerprint: user.fingerprint
      }, 'medium');
      alert('✅ Utilisateur expulsé');
    } catch (err) {
      console.error('Error kicking user:', err);
      alert('❌ Erreur lors de l\'expulsion');
    }
    setIsLoading(false);
  };

  const handleUnbanUser = async (ban: BannedUser) => {
    if (!confirm(`Débannir ${ban.username} ?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: ban.fingerprint,
          ip: ban.ip
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAllData();
        alert('✅ Utilisateur débanni');
      }
    } catch (err) {
      console.error('Error unbanning user:', err);
      alert('❌ Erreur');
    }
    setIsLoading(false);
  };

  const handleUnmuteUser = async (mute: MutedUser) => {
    if (!confirm(`Démute ${mute.username} ?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/unmute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: mute.fingerprint
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAllData();
        alert('✅ Utilisateur démute');
      }
    } catch (err) {
      console.error('Error unmuting user:', err);
      alert('❌ Erreur');
    }
    setIsLoading(false);
  };

  const handleDeleteMessage = async (messageId: string, username: string) => {
    if (!confirm('Supprimer ce message ?')) return;

    try {
      wsService?.send({ type: 'delete_message', messageId });
      await logAction('MESSAGE_DELETED', username, { messageId }, 'low');
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleBulkAction = async (action: 'kick' | 'mute' | 'ban') => {
    if (selectedUsers.size === 0) {
      alert('Sélectionnez des utilisateurs');
      return;
    }

    if (!confirm(`${action.toUpperCase()} ${selectedUsers.size} utilisateurs ?`)) return;

    setIsLoading(true);
    for (const userId of selectedUsers) {
      const user = connectedUsers.find(u => u.id === userId);
      if (user) {
        if (action === 'kick') await handleKickUser(user);
        else if (action === 'mute') await handleMuteUser(user);
        else if (action === 'ban') await handleBanUser(user);
      }
    }
    setSelectedUsers(new Set());
    setIsLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return connectedUsers.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.ip.includes(searchTerm);
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [connectedUsers, searchTerm, filterRole]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.ip_address.includes(searchTerm);
      const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [activityLogs, searchTerm, filterSeverity]);

  const stats = useMemo(() => {
    const now = Date.now();
    const recentUsers = connectedUsers.filter(u =>
      now - new Date(u.connectTime).getTime() < 300000 // 5 min
    );
    const highSeverityLogs = activityLogs.filter(l =>
      l.severity === 'high' || l.severity === 'critical'
    );

    return {
      totalUsers: connectedUsers.length,
      recentUsers: recentUsers.length,
      totalMessages: chatMessages.length,
      recentMessages: chatMessages.filter(m =>
        now - new Date(m.timestamp).getTime() < 300000
      ).length,
      totalLogs: activityLogs.length,
      highSeverityAlerts: highSeverityLogs.length,
      bannedCount: bannedUsers.length,
      mutedCount: mutedUsers.length
    };
  }, [connectedUsers, chatMessages, activityLogs, bannedUsers, mutedUsers]);

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Action', 'Utilisateur', 'IP', 'Sévérité', 'Admin'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action_type,
        log.username,
        log.ip_address,
        log.severity,
        log.admin_username
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.csv`;
    a.click();
  };

  const exportUsers = () => {
    const csvContent = [
      ['Username', 'IP', 'Connection Time', 'Role', 'Status'].join(','),
      ...filteredUsers.map(user => [
        user.username,
        user.ip,
        new Date(user.connectTime).toLocaleString(),
        user.role || 'viewer',
        'online'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Utilisateurs en ligne',
            value: stats.totalUsers,
            change: `+${stats.recentUsers} récents`,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
          },
          {
            label: 'Messages totaux',
            value: stats.totalMessages,
            change: `+${stats.recentMessages} récents`,
            icon: MessageSquare,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
          },
          {
            label: 'Logs d\'activité',
            value: stats.totalLogs,
            change: `${stats.highSeverityAlerts} alertes`,
            icon: Activity,
            color: 'from-orange-500 to-amber-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
          },
          {
            label: 'Modération',
            value: stats.bannedCount + stats.mutedCount,
            change: `${stats.bannedCount}B / ${stats.mutedCount}M`,
            icon: Shield,
            color: 'from-red-500 to-rose-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20'
          }
        ].map((stat, index) => (
          <div key={index} className={`${stat.bg} backdrop-blur-sm border ${stat.border} rounded-xl p-5 hover:scale-105 transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-slate-400 text-sm mb-1">{stat.label}</div>
            <div className="text-slate-500 text-xs">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-400" />
              Activité Récente
            </h3>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Voir tout →
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activityLogs.slice(0, 8).map(log => (
              <div key={log.id} className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-semibold">{log.action_type}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    log.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    log.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {log.severity}
                  </span>
                </div>
                <div className="text-slate-400 text-xs">
                  {log.username} • {formatTime(new Date(log.created_at))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online Users */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Utilisateurs en ligne
            </h3>
            <button
              onClick={() => setActiveTab('users')}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Gérer →
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {connectedUsers.slice(0, 8).map(user => (
              <div key={user.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{user.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{user.username}</div>
                    <div className="text-slate-400 text-xs">{user.ip}</div>
                  </div>
                </div>
                <span className="flex items-center text-green-400 text-xs font-semibold">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  En ligne
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2 text-emerald-400" />
          État du Système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'WebSocket', status: 'online', icon: Wifi, color: 'text-green-400' },
            { label: 'Base de données', status: 'online', icon: Database, color: 'text-green-400' },
            { label: 'RTMP Server', status: 'online', icon: Radio, color: 'text-green-400' },
            { label: 'Auto-Sync', status: autoRefresh ? 'active' : 'paused', icon: RefreshCw, color: autoRefresh ? 'text-green-400' : 'text-gray-400' }
          ].map((item, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-4 text-center">
              <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
              <div className="text-white font-semibold text-sm">{item.label}</div>
              <div className={`text-xs font-semibold mt-1 ${item.color}`}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher utilisateur, IP..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Modérateur</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            {selectedUsers.size > 0 && (
              <>
                <span className="text-slate-400 text-sm">{selectedUsers.size} sélectionné(s)</span>
                <button
                  onClick={() => handleBulkAction('kick')}
                  className="px-3 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg text-sm font-semibold"
                >
                  Kick tous
                </button>
                <button
                  onClick={() => handleBulkAction('mute')}
                  className="px-3 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-sm font-semibold"
                >
                  Mute tous
                </button>
                <button
                  onClick={() => handleBulkAction('ban')}
                  className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-semibold"
                >
                  Ban tous
                </button>
              </>
            )}
            <button
              onClick={exportUsers}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg font-semibold flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="rounded border-slate-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">IP / Fingerprint</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Connexion</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Rôle</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user.username[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user.username}</div>
                        <div className="text-slate-400 text-xs">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-slate-300 font-mono text-sm">{user.ip}</div>
                    <div className="text-slate-500 text-xs font-mono">{user.fingerprint.slice(0, 12)}...</div>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-sm">
                    <div>{formatTime(user.connectTime)}</div>
                    <div className="text-xs text-slate-500">
                      {Math.floor((Date.now() - new Date(user.connectTime).getTime()) / 60000)}m
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {user.role || 'viewer'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleMuteUser(user)}
                        disabled={isLoading}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Mute"
                      >
                        <VolumeX className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleKickUser(user)}
                        disabled={isLoading}
                        className="p-2 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Kick"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleBanUser(user)}
                        disabled={isLoading}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Ban"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
          Messages Récents
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chatMessages.slice(-20).reverse().map(msg => (
            <div key={msg.id} className="bg-slate-800/50 rounded-lg p-3 flex items-start justify-between hover:bg-slate-800/70 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-white font-semibold">{msg.username}</span>
                  <span className="text-slate-500 text-xs">{formatTime(msg.timestamp)}</span>
                  {msg.role && msg.role !== 'viewer' && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      msg.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {msg.role}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm">{msg.text}</p>
              </div>
              <button
                onClick={() => handleDeleteMessage(msg.id, msg.username)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-3"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModeration = () => (
    <div className="space-y-6">
      {/* Banned Users */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Ban className="h-5 w-5 mr-2 text-red-400" />
            Utilisateurs Bannis ({bannedUsers.length})
          </h3>
          <button
            onClick={fetchBannedUsers}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bannedUsers.map(ban => (
            <div key={ban.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Ban className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{ban.username}</div>
                      <div className="text-slate-400 text-xs">Par {ban.banned_by} • {formatTime(new Date(ban.banned_at))}</div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-2">
                    <div className="text-slate-400 text-xs mb-1">Raison:</div>
                    <div className="text-white text-sm">{ban.reason}</div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-slate-500">IP: {ban.ip}</span>
                    <span className="text-slate-500">ID: {ban.fingerprint.slice(0, 8)}...</span>
                    <span className={`px-2 py-1 rounded font-bold ${
                      ban.is_permanent ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {ban.is_permanent ? 'Permanent' : 'Temporaire'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnbanUser(ban)}
                  disabled={isLoading}
                  className="ml-4 p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Débannir"
                >
                  <Unlock className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          {bannedUsers.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">Aucun utilisateur banni</p>
            </div>
          )}
        </div>
      </div>

      {/* Muted Users */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <VolumeX className="h-5 w-5 mr-2 text-yellow-400" />
            Utilisateurs Mutes ({mutedUsers.length})
          </h3>
          <button
            onClick={fetchMutedUsers}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {mutedUsers.map(mute => {
            const timeLeft = new Date(mute.mute_end_time).getTime() - Date.now();
            const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));

            return (
              <div key={mute.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <VolumeX className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{mute.username}</div>
                        <div className="text-slate-400 text-xs">Par {mute.muted_by} • {formatTime(new Date(mute.muted_at))}</div>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-2">
                      <div className="text-slate-400 text-xs mb-1">Raison:</div>
                      <div className="text-white text-sm">{mute.reason}</div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-slate-500">Fin: {formatTime(new Date(mute.mute_end_time))}</span>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded font-bold">
                        {minutesLeft}m restantes
                      </span>
                      <span className="text-slate-500">Mute #{mute.mute_count}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnmuteUser(mute)}
                    disabled={isLoading}
                    className="ml-4 p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Démute"
                  >
                    <Unlock className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
          {mutedUsers.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">Aucun utilisateur mute</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher logs..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="all">Toutes sévérités</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchActivityLogs}
              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg font-semibold flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div key={log.id} className={`rounded-lg p-4 border backdrop-blur-sm transition-all hover:scale-[1.01] ${
            log.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            log.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            log.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  log.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  log.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {log.severity.toUpperCase()}
                </span>
                <span className="text-white font-bold text-lg">{log.action_type}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400 text-sm">
                <Clock className="h-4 w-4" />
                <span>{formatTime(new Date(log.created_at))}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-slate-500 text-xs mb-1">Utilisateur</div>
                <div className="text-white font-semibold">{log.username || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">IP</div>
                <div className="text-white font-mono text-sm">{log.ip_address || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Empreinte</div>
                <div className="text-white font-mono text-sm">{log.fingerprint ? `${log.fingerprint.slice(0, 8)}...` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Admin</div>
                <div className="text-white font-semibold">{log.admin_username || 'System'}</div>
              </div>
            </div>

            {log.details && Object.keys(log.details).length > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-2">Détails:</div>
                <pre className="text-slate-300 text-xs overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">Aucun log trouvé</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'moderation', label: 'Modération', icon: Shield },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
                    PANNEAU ADMIN
                  </h1>
                  <p className="text-slate-400 font-medium">Contrôle et surveillance en temps réel</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    autoRefresh
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span>{autoRefresh ? 'Auto-Sync ON' : 'Auto-Sync OFF'}</span>
                </button>
                <div className="text-right">
                  <div className="text-white font-semibold">{currentUser?.username}</div>
                  <div className="text-slate-400 text-sm">Administrateur</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2 mb-6 shadow-lg">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in-0 duration-300">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'moderation' && renderModeration()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Settings className="h-6 w-6 mr-3 text-slate-400" />
                Paramètres Système
              </h3>
              <div className="text-center py-12">
                <Terminal className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg">Fonctionnalités à venir...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
