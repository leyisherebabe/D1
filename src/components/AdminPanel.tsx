import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Settings, Plus, Trash2, Eye, Ban, VolumeX,
  Server, Lock, AlertTriangle, CheckCircle, XCircle, Play, Pause,
  Monitor, Database, Wifi, Globe, Key, Crown, Zap
} from 'lucide-react';
import { ConnectedUser, ChatMessage, StreamSource, SecurityLog } from '../types';
import { formatTime, generateSecureId, validateM3U8Url, sanitizeInput } from '../utils';

interface AdminPanelProps {
  currentUser: any;
  connectedUsers: ConnectedUser[];
  chatMessages: ChatMessage[];
  wsService: any;
  onStreamSourceChange: (source: StreamSource | null) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  connectedUsers,
  chatMessages,
  wsService,
  onStreamSourceChange
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'streams' | 'security' | 'settings'>('dashboard');
  const [streamSources, setStreamSources] = useState<StreamSource[]>([]);
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [systemStats, setSystemStats] = useState({
    uptime: 0,
    totalConnections: 0,
    activeStreams: 0,
    securityAlerts: 0
  });

  useEffect(() => {
    // Charger les sources de stream depuis localStorage
    const savedSources = localStorage.getItem('streamSources');
    if (savedSources) {
      const sources = JSON.parse(savedSources);
      setStreamSources(sources);
      const active = sources.find((s: StreamSource) => s.isActive);
      if (active) {
        setActiveSource(active);
        onStreamSourceChange(active);
      }
    }

    // Charger les logs de sécurité
    const savedLogs = localStorage.getItem('securityLogs');
    if (savedLogs) {
      setSecurityLogs(JSON.parse(savedLogs));
    }

    // Simuler les statistiques système
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        totalConnections: connectedUsers.length,
        activeStreams: streamSources.filter(s => s.isActive).length,
        securityAlerts: securityLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectedUsers.length, streamSources, securityLogs, onStreamSourceChange]);

  const addStreamSource = () => {
    if (!newSourceUrl.trim() || !newSourceName.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (!validateM3U8Url(newSourceUrl)) {
      alert('URL invalide');
      return;
    }

    const newSource: StreamSource = {
      id: generateSecureId(),
      name: sanitizeInput(newSourceName),
      url: newSourceUrl.trim(),
      type: newSourceUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
      isActive: false,
      createdAt: new Date(),
      createdBy: currentUser?.username || 'Admin'
    };

    const updatedSources = [...streamSources, newSource];
    setStreamSources(updatedSources);
    localStorage.setItem('streamSources', JSON.stringify(updatedSources));

    setNewSourceUrl('');
    setNewSourceName('');

    // Log de sécurité
    addSecurityLog('STREAM_SOURCE_ADDED', `Nouvelle source ajoutée: ${newSource.name}`, 'medium');
  };

  const toggleStreamSource = (sourceId: string) => {
    const updatedSources = streamSources.map(source => ({
      ...source,
      isActive: source.id === sourceId ? !source.isActive : false
    }));

    setStreamSources(updatedSources);
    localStorage.setItem('streamSources', JSON.stringify(updatedSources));

    const newActiveSource = updatedSources.find(s => s.isActive) || null;
    setActiveSource(newActiveSource);
    onStreamSourceChange(newActiveSource);

    addSecurityLog('STREAM_STATUS_CHANGED', `Source ${newActiveSource ? 'activée' : 'désactivée'}`, 'low');
  };

  const deleteStreamSource = (sourceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette source ?')) return;

    const sourceToDelete = streamSources.find(s => s.id === sourceId);
    const updatedSources = streamSources.filter(source => source.id !== sourceId);
    
    setStreamSources(updatedSources);
    localStorage.setItem('streamSources', JSON.stringify(updatedSources));

    if (activeSource?.id === sourceId) {
      setActiveSource(null);
      onStreamSourceChange(null);
    }

    addSecurityLog('STREAM_SOURCE_DELETED', `Source supprimée: ${sourceToDelete?.name}`, 'medium');
  };

  const banUser = (userId: string) => {
    const user = connectedUsers.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Bannir ${user.username} ?`)) {
      wsService?.sendAdminAction('ban_user', userId, user.username);
      addSecurityLog('USER_BANNED', `Utilisateur banni: ${user.username}`, 'high');
    }
  };

  const muteUser = (userId: string) => {
    const user = connectedUsers.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Muter ${user.username} ?`)) {
      wsService?.sendAdminAction('mute_user', userId, user.username);
      addSecurityLog('USER_MUTED', `Utilisateur muté: ${user.username}`, 'medium');
    }
  };

  const deleteMessage = (messageId: string) => {
    wsService?.sendDeleteMessage(messageId);
    addSecurityLog('MESSAGE_DELETED', `Message supprimé: ${messageId}`, 'low');
  };

  const addSecurityLog = (action: string, details: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const newLog: SecurityLog = {
      id: generateSecureId(),
      action,
      username: currentUser?.username,
      ip: 'localhost', // À remplacer par la vraie IP
      timestamp: new Date(),
      details,
      severity
    };

    const updatedLogs = [newLog, ...securityLogs].slice(0, 100); // Garder seulement les 100 derniers
    setSecurityLogs(updatedLogs);
    localStorage.setItem('securityLogs', JSON.stringify(updatedLogs));
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Utilisateurs connectés', value: connectedUsers.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Messages chat', value: chatMessages.length, icon: Activity, color: 'from-green-500 to-emerald-500' },
          { label: 'Sources actives', value: streamSources.filter(s => s.isActive).length, icon: Play, color: 'from-purple-500 to-pink-500' },
          { label: 'Alertes sécurité', value: systemStats.securityAlerts, icon: AlertTriangle, color: 'from-red-500 to-orange-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* État du système */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Server className="h-6 w-6 mr-3 text-green-400" />
          État du Système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Serveur WebSocket</h4>
            <p className="text-green-400">En ligne</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Base de données</h4>
            <p className="text-blue-400">Connectée</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-8 w-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Streaming</h4>
            <p className={activeSource ? "text-green-400" : "text-slate-400"}>
              {activeSource ? 'Actif' : 'Inactif'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
      <h3 className="text-2xl font-semibold text-white mb-6">Gestion des Utilisateurs</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 py-3">Utilisateur</th>
              <th className="text-left text-slate-400 py-3">Rôle</th>
              <th className="text-left text-slate-400 py-3">IP</th>
              <th className="text-left text-slate-400 py-3">Connecté depuis</th>
              <th className="text-left text-slate-400 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connectedUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 text-slate-300 font-mono text-sm">{user.ip}</td>
                <td className="py-4 text-slate-400 text-sm">
                  {formatTime(user.connectTime)}
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => muteUser(user.id)}
                      className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-orange-500/10 transition-all"
                      title="Muter"
                    >
                      <VolumeX className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => banUser(user.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                      title="Bannir"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStreams = () => (
    <div className="space-y-8">
      {/* Ajouter une nouvelle source */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Plus className="h-6 w-6 mr-3 text-green-400" />
          Ajouter une Source de Stream
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de la source
            </label>
            <input
              type="text"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="Ex: Stream Principal"
              className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL du flux (.m3u8, .mp4, etc.)
            </label>
            <input
              type="url"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="https://exemple.com/stream.m3u8"
              className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all"
            />
          </div>
        </div>
        <button
          onClick={addStreamSource}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
        >
          Ajouter la Source
        </button>
      </div>

      {/* Liste des sources */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6">Sources de Stream</h3>
        <div className="space-y-4">
          {streamSources.map((source) => (
            <div key={source.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{source.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      source.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {source.isActive ? 'ACTIF' : 'INACTIF'}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{source.url}</p>
                  <p className="text-slate-500 text-xs">
                    Créé par {source.createdBy} le {formatTime(source.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleStreamSource(source.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      source.isActive 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {source.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteStreamSource(source.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {streamSources.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Monitor className="h-12 w-12 mx-auto mb-4" />
              <p>Aucune source de stream configurée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
        <Shield className="h-6 w-6 mr-3 text-red-400" />
        Logs de Sécurité
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {securityLogs.map((log) => (
          <div key={log.id} className={`p-4 rounded-xl border ${
            log.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            log.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            log.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-slate-800/50 border-slate-700'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  log.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  log.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {log.severity.toUpperCase()}
                </span>
                <span className="text-white font-medium">{log.action}</span>
              </div>
              <span className="text-slate-500 text-sm">{formatTime(log.timestamp)}</span>
            </div>
            <p className="text-slate-300 text-sm mb-2">{log.details}</p>
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              {log.username && <span>Utilisateur: {log.username}</span>}
              <span>IP: {log.ip}</span>
            </div>
          </div>
        ))}
        {securityLogs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <p>Aucun log de sécurité</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-900/50 border border-slate-700 rounded-3xl p-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Panneau d'Administration</h1>
                <p className="text-slate-400 text-lg">Gestion complète de la plateforme ABD Stream</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: Activity },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'streams', label: 'Sources Stream', icon: Monitor },
              { id: 'security', label: 'Sécurité', icon: Shield },
              { id: 'settings', label: 'Paramètres', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="animate-in fade-in-0 duration-500">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'streams' && renderStreams()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-white mb-6">Paramètres Système</h3>
              <p className="text-slate-400">Fonctionnalités à venir...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;