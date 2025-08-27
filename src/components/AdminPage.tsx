import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  MessageCircle, 
  Activity, 
  Settings,
  Eye,
  Ban,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Save,
  X,
  Crown,
  Sparkles
} from 'lucide-react';
import { ChatMessage, ConnectedUser, StreamLog, Report, PopupAnnouncement } from '../types';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chat' | 'logs' | 'reports' | 'announcements'>('overview');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [announcements, setAnnouncements] = useState<PopupAnnouncement[]>([]);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    // Charger les données depuis localStorage
    const savedReports = JSON.parse(localStorage.getItem('chatReports') || '[]');
    const savedAnnouncements = JSON.parse(localStorage.getItem('popupAnnouncements') || '[]');
    
    setReports(savedReports);
    setAnnouncements(savedAnnouncements);

    // Simuler des utilisateurs connectés
    const mockUsers: ConnectedUser[] = [
      {
        id: '1',
        username: 'Anonyme_123',
        ip: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        connectTime: new Date(Date.now() - 1800000),
        lastActivity: new Date(Date.now() - 300000),
        page: '/live'
      },
      {
        id: '2',
        username: 'Ghost_456',
        ip: '10.0.0.23',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        connectTime: new Date(Date.now() - 3600000),
        lastActivity: new Date(Date.now() - 120000),
        page: '/streams'
      }
    ];

    const mockLogs: StreamLog[] = [
      {
        id: '1',
        action: 'USER_CONNECT',
        details: 'Nouvel utilisateur connecté',
        timestamp: new Date(Date.now() - 600000),
        username: 'Anonyme_123',
        ip: '192.168.1.45'
      },
      {
        id: '2',
        action: 'MESSAGE_SENT',
        details: 'Message envoyé dans le chat',
        timestamp: new Date(Date.now() - 300000),
        username: 'Ghost_456'
      }
    ];

    setConnectedUsers(mockUsers);
    setStreamLogs(mockLogs);
  }, []);

  const handleReportAction = (reportId: string, action: 'resolved' | 'dismissed') => {
    const updatedReports = reports.map(report => 
      report.id === reportId ? { ...report, status: action } : report
    );
    setReports(updatedReports);
    localStorage.setItem('chatReports', JSON.stringify(updatedReports));
  };

  const createAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.description) {
      const announcement: PopupAnnouncement = {
        id: Date.now().toString(),
        title: newAnnouncement.title,
        description: newAnnouncement.description,
        image: newAnnouncement.image || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400',
        isActive: true
      };

      const updatedAnnouncements = [...announcements, announcement];
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('popupAnnouncements', JSON.stringify(updatedAnnouncements));
      
      setNewAnnouncement({ title: '', description: '', image: '' });
      setShowNewAnnouncement(false);
    }
  };

  const toggleAnnouncement = (id: string) => {
    const updatedAnnouncements = announcements.map(ann => 
      ann.id === id ? { ...ann, isActive: !ann.isActive } : ann
    );
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('popupAnnouncements', JSON.stringify(updatedAnnouncements));
  };

  const deleteAnnouncement = (id: string) => {
    const updatedAnnouncements = announcements.filter(ann => ann.id !== id);
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('popupAnnouncements', JSON.stringify(updatedAnnouncements));
  };

  const banUser = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir bannir cet utilisateur ?')) {
      setConnectedUsers(prev => prev.filter(user => user.id !== userId));
      
      const logEntry: StreamLog = {
        id: Date.now().toString(),
        action: 'USER_BANNED',
        details: 'Utilisateur banni par l\'administrateur',
        timestamp: new Date(),
        username: connectedUsers.find(u => u.id === userId)?.username
      };
      setStreamLogs(prev => [logEntry, ...prev]);
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Utilisateurs connectés', value: connectedUsers.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Messages chat', value: chatMessages.length, icon: MessageCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Signalements', value: reports.filter(r => r.status === 'pending').length, icon: AlertTriangle, color: 'from-orange-500 to-red-500' },
          { label: 'Logs système', value: streamLogs.length, icon: Activity, color: 'from-purple-500 to-pink-500' }
        ].map((stat, index) => (
          <div key={index} className="glass-dark border border-slate-700/50 rounded-2xl p-6">
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-dark border border-slate-700/50 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6">Activité Récente</h3>
        <div className="space-y-4">
          {streamLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-white font-medium">{log.action}</p>
                <p className="text-slate-400 text-sm">{log.details}</p>
              </div>
              <div className="text-slate-500 text-sm">
                {log.timestamp.toLocaleTimeString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="glass-dark border border-slate-700/50 rounded-2xl p-8">
      <h3 className="text-2xl font-semibold text-white mb-6">Utilisateurs Connectés</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 py-3">Utilisateur</th>
              <th className="text-left text-slate-400 py-3">IP</th>
              <th className="text-left text-slate-400 py-3">Page</th>
              <th className="text-left text-slate-400 py-3">Connecté depuis</th>
              <th className="text-left text-slate-400 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connectedUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="py-4 text-white font-medium">{user.username}</td>
                <td className="py-4 text-slate-300 font-mono text-sm">{user.ip}</td>
                <td className="py-4 text-slate-300">{user.page}</td>
                <td className="py-4 text-slate-400 text-sm">
                  {Math.floor((Date.now() - user.connectTime.getTime()) / 60000)} min
                </td>
                <td className="py-4">
                  <button
                    onClick={() => banUser(user.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="glass-dark border border-slate-700/50 rounded-2xl p-8">
      <h3 className="text-2xl font-semibold text-white mb-6">Signalements</h3>
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold">Signalement de {report.reporterUsername}</h4>
                <p className="text-slate-400 text-sm">Contre {report.reportedUser}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {report.status === 'pending' ? 'En attente' : 
                 report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
              </span>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm mb-2">Message signalé :</p>
              <p className="text-white">"{report.reportedMessage}"</p>
            </div>
            
            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-2">Raison :</p>
              <p className="text-slate-200">{report.reportReason}</p>
            </div>
            
            {report.status === 'pending' && (
              <div className="flex space-x-3">
                <button
                  onClick={() => handleReportAction(report.id, 'resolved')}
                  className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Résoudre</span>
                </button>
                <button
                  onClick={() => handleReportAction(report.id, 'dismissed')}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Rejeter</span>
                </button>
              </div>
            )}
          </div>
        ))}
        
        {reports.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Aucun signalement pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-white">Annonces Popup</h3>
        <button
          onClick={() => setShowNewAnnouncement(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Annonce</span>
        </button>
      </div>

      {showNewAnnouncement && (
        <div className="glass-dark border border-slate-700/50 rounded-2xl p-8">
          <h4 className="text-xl font-semibold text-white mb-6">Créer une Annonce</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-slate-300 mb-2">Titre</label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all"
                placeholder="Titre de l'annonce"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2">Description</label>
              <textarea
                value={newAnnouncement.description}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-32 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all resize-none"
                placeholder="Description de l'annonce"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2">Image (URL)</label>
              <input
                type="url"
                value={newAnnouncement.image}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, image: e.target.value }))}
                className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all"
                placeholder="https://exemple.com/image.jpg"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={createAnnouncement}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 transform hover:scale-105"
              >
                <Save className="h-5 w-5" />
                <span>Créer</span>
              </button>
              <button
                onClick={() => setShowNewAnnouncement(false)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="glass-dark border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-xl font-semibold text-white">{announcement.title}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleAnnouncement(announcement.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    announcement.isActive 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                  }`}
                >
                  {announcement.isActive ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => deleteAnnouncement(announcement.id)}
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {announcement.image && (
              <img
                src={announcement.image}
                alt={announcement.title}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            
            <p className="text-slate-300 text-sm">{announcement.description}</p>
          </div>
        ))}
      </div>
      
      {announcements.length === 0 && (
        <div className="glass-dark border border-slate-700/50 rounded-2xl p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-500">Aucune annonce créée</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
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
        <div className="glass-dark border border-slate-700/50 rounded-2xl p-2 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'reports', label: 'Signalements', icon: AlertTriangle },
              { id: 'announcements', label: 'Annonces', icon: Sparkles }
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
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'announcements' && renderAnnouncements()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;