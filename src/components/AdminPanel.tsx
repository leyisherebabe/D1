import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Activity, Settings, Ban, VolumeX, Trash2, Eye, Server, Database, Radio, BarChart3, Terminal, Crown, Search, Clock, Globe, AlertTriangle, CheckCircle, XCircle, UserX, MessageSquare, Filter, Download } from 'lucide-react';
import { ConnectedUser, ChatMessage, StreamSource } from '../types';
import { formatTime } from '../utils';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  currentUser: any;
  connectedUsers: ConnectedUser[];
  chatMessages: ChatMessage[];
  wsService: any;
  onStreamSourceChange: (source: StreamSource | null) => void;
}

interface ActivityLog {
  id: string;
  action_type: string;
  username: string;
  ip_address: string;
  fingerprint: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  admin_username: string;
  created_at: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  connectedUsers,
  chatMessages,
  wsService,
  onStreamSourceChange
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'settings'>('dashboard');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const logAction = useCallback(async (
    actionType: string,
    username: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action_type: actionType,
          username,
          ip_address: details.ip || '',
          fingerprint: details.fingerprint || '',
          details,
          severity,
          admin_username: currentUser?.username || 'admin'
        });

      if (!error) {
        await fetchActivityLogs();
      }
    } catch (err) {
      console.error('Error logging action:', err);
    }
  }, [currentUser]);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setActivityLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchActivityLogs();
      const interval = setInterval(fetchActivityLogs, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchActivityLogs]);

  const handleBanUser = async (user: ConnectedUser) => {
    const reason = prompt('Raison du ban:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert({
          fingerprint: user.fingerprint,
          ip_address: user.ip,
          username: user.username,
          reason,
          banned_by: currentUser?.username || 'admin',
          is_permanent: true
        });

      if (!error) {
        wsService?.send({ type: 'ban_user', fingerprint: user.fingerprint });
        await logAction('USER_BANNED', user.username, {
          ip: user.ip,
          fingerprint: user.fingerprint,
          reason
        }, 'high');
        alert('✅ Utilisateur banni avec succès');
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

      const { error } = await supabase
        .from('muted_users')
        .insert({
          fingerprint: user.fingerprint,
          username: user.username,
          ip_address: user.ip,
          reason,
          muted_by: currentUser?.username || 'admin',
          mute_end_time: muteEndTime.toISOString()
        });

      if (!error) {
        wsService?.send({
          type: 'mute_user',
          fingerprint: user.fingerprint,
          duration: duration * 60000
        });
        await logAction('USER_MUTED', user.username, {
          ip: user.ip,
          fingerprint: user.fingerprint,
          duration: `${duration}min`,
          reason
        }, 'medium');
        alert('✅ Utilisateur mute avec succès');
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

  const handleDeleteMessage = async (messageId: string, username: string) => {
    if (!confirm('Supprimer ce message ?')) return;

    try {
      wsService?.send({ type: 'delete_message', messageId });
      await logAction('MESSAGE_DELETED', username, { messageId }, 'low');
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip_address.includes(searchTerm);
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

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
    a.download = `activity-logs-${Date.now()}.csv`;
    a.click();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Utilisateurs en ligne',
            value: connectedUsers.length,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
          },
          {
            label: 'Messages chat',
            value: chatMessages.length,
            icon: MessageSquare,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
          },
          {
            label: 'Logs activité',
            value: activityLogs.length,
            icon: Activity,
            color: 'from-orange-500 to-amber-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
          },
          {
            label: 'Alertes sécurité',
            value: activityLogs.filter(l => l.severity === 'high' || l.severity === 'critical').length,
            icon: AlertTriangle,
            color: 'from-red-500 to-rose-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20'
          }
        ].map((stat, index) => (
          <div key={index} className={`${stat.bg} backdrop-blur-sm border ${stat.border} rounded-xl p-5 transition-all hover:scale-105`}>
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-400" />
            Utilisateurs Récents
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {connectedUsers.slice(0, 5).map(user => (
              <div key={user.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{user.username[0]}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{user.username}</div>
                    <div className="text-slate-400 text-xs">{user.ip}</div>
                  </div>
                </div>
                <span className="text-green-400 text-xs">● En ligne</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-orange-400" />
            Activité Récente
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="bg-slate-800/50 rounded-lg p-3">
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
                <div className="text-slate-400 text-xs">{log.username} • {formatTime(new Date(log.created_at))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Gestion des Utilisateurs</h2>
        <span className="text-slate-400">{connectedUsers.length} utilisateurs connectés</span>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Utilisateur</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">IP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Connexion</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {connectedUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user.username[0]}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user.username}</div>
                        <div className="text-slate-400 text-xs">{user.fingerprint.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-sm">{user.ip}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{formatTime(user.connectTime)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      En ligne
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
          {connectedUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">Aucun utilisateur connecté</p>
            </div>
          )}
        </div>
      </div>

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

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-400" />
            Logs d'Activité
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="all">Toutes les sévérités</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
              <Shield className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500">Aucun log trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
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
                  <p className="text-slate-400 font-medium">Contrôle total de la plateforme</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{currentUser?.username}</div>
                <div className="text-slate-400 text-sm">Administrateur</div>
              </div>
            </div>
          </div>
        </div>

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

        <div className="animate-in fade-in-0 duration-300">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
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
