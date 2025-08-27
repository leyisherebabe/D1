import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, Lock, Globe, Users, Star, ArrowRight, Sparkles } from 'lucide-react';
import HomePage from './components/HomePage';
import StreamsListPage from './components/StreamsListPage';
import AdminPage from './components/AdminPage';
import LiveStreamPage from './components/LiveStreamPage';
import PopupAnnouncement from './components/modals/PopupAnnouncement';
import DMCAPage from './components/DMCAPage';
import LegalPage from './components/LegalPage';
import { ENCRYPTION_KEY, ADMIN_ACCESS_CODE } from './utils/constants';
import { PopupAnnouncement as PopupAnnouncementType, ChatMessage, Report } from './types';
import { WebSocketService } from './services/websocket'; // Importez le service WebSocket

type Page = 'home' | 'streaming' | 'admin' | 'streams' | 'live' | 'dmca' | 'legal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [keyInput, setKeyInput] = useState('');
  const [showKeyError, setShowKeyError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PopupAnnouncementType | null>(null);
  const [activeUsers, setActiveUsers] = useState(0); // État pour les utilisateurs actifs
  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'StreamBot',
      message: '🎉 Bienvenue dans le stream ! Respectez les règles du chat.',
      timestamp: new Date(Date.now() - 600000),
      role: 'admin',
      isSystem: true,
      color: '#ef4444'
    },
    {
      id: '2',
      username: 'Anonyme_42',
      message: 'Super stream ! La qualité est parfaite 🔥',
      timestamp: new Date(Date.now() - 480000),
      role: 'viewer',
      color: '#3b82f6'
    },
    {
      id: '3',
      username: 'Mod_Sarah',
      message: 'N\'oubliez pas de suivre les règles ! 🛡️',
      timestamp: new Date(Date.now() - 240000),
      role: 'moderator',
      color: '#8b5cf6'
    }
  ]);
  const [wsServiceInstance, setWsServiceInstance] = useState<WebSocketService | null>(null);

  // Effet pour l'authentification initiale
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated');
    const adminAuth = sessionStorage.getItem('adminAccess');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
    if (adminAuth === 'true') {
      setAdminAccess(true);
    }
  }, []);

  // Effet pour la logique WebSocket des utilisateurs actifs
  // Ce useEffect est maintenant au niveau supérieur et gère la connexion WebSocket
  useEffect(() => {
    const wsService = new WebSocketService();
    wsService.connect();
    setWsServiceInstance(wsService);

    if (wsService.ws) {
      wsService.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user_count') {
          setActiveUsers(data.count);
        } else if (data.type === 'chat_message' && data.message) {
          // Ajouter le message de chat reçu à l'état global
          setAllChatMessages(prev => [...prev.slice(-49), data.message]);
        }
      };
    }

    return () => {
      if (wsService.ws) {
        wsService.ws.close();
      }
    };
  }, []); // Le tableau de dépendances vide assure qu'il ne s'exécute qu'une fois au montage

  // Effet pour vérifier les popups actives
  useEffect(() => {
    const checkForPopups = () => {
      const savedPopups = JSON.parse(localStorage.getItem('popupAnnouncements') || '[]');
      const activePopup = savedPopups.find((popup: PopupAnnouncementType) => popup.isActive);
      
      if (activePopup && !showPopup) {
        setCurrentPopup(activePopup);
        setShowPopup(true);
      }
    };

    checkForPopups();
    const interval = setInterval(checkForPopups, 5000);
    
    return () => clearInterval(interval);
  }, [showPopup]);

  // Fonctions de modération centralisées
  const handleDeleteChatMessage = (messageId: string) => {
    setAllChatMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleMuteChatUser = (targetUsername: string, moderatorUsername: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'StreamBot',
      message: `🔇 ${targetUsername} a été mute par ${moderatorUsername}`,
      timestamp: new Date(),
      role: 'admin',
      isSystem: true,
      color: '#ef4444'
    };
    setAllChatMessages(prev => [...prev.slice(-49), systemMessage]);
  };

  const handleBanChatUser = (targetUsername: string, moderatorUsername: string) => {
    // Supprimer tous les messages de l'utilisateur banni
    setAllChatMessages(prev => prev.filter(msg => msg.username !== targetUsername));
    
    // Ajouter un message système
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'StreamBot',
      message: `🚫 ${targetUsername} a été banni par ${moderatorUsername}`,
      timestamp: new Date(),
      role: 'admin',
      isSystem: true,
      color: '#ef4444'
    };
    setAllChatMessages(prev => [...prev.slice(-49), systemMessage]);
  };

  const handleReportMessage = (report: Report) => {
    const existingReports = JSON.parse(localStorage.getItem('chatReports') || '[]');
    localStorage.setItem('chatReports', JSON.stringify([...existingReports, report]));
  };

  const addChatMessage = (message: ChatMessage) => {
    setAllChatMessages(prev => [...prev.slice(-49), message]);
  };

  const handleClosePopup = (announcementId: string) => {
    const savedPopups = JSON.parse(localStorage.getItem('popupAnnouncements') || '[]');
    const updatedPopups = savedPopups.map((popup: PopupAnnouncementType) => 
      popup.id === announcementId ? { ...popup, isActive: false } : popup
    );
    localStorage.setItem('popupAnnouncements', JSON.stringify(updatedPopups));
    setShowPopup(false);
    setCurrentPopup(null);
  };
  // Effet pour la détection de la combinaison de touches secrète (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (!adminAccess) {
          setShowAdminPrompt(true);
        } else {
          setCurrentPage('admin');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminAccess]);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (keyInput === ENCRYPTION_KEY) {
      setIsAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
      setShowKeyError(false);
    } else {
      setShowKeyError(true);
      setTimeout(() => setShowKeyError(false), 4000);
    }
    setKeyInput('');
    setIsLoading(false);
  };

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (adminCode === ADMIN_ACCESS_CODE) {
      setAdminAccess(true);
      sessionStorage.setItem('adminAccess', 'true');
      setShowAdminPrompt(false);
      setCurrentPage('admin');
    } else {
      setShowKeyError(true);
      setTimeout(() => setShowKeyError(false), 3000);
    }
    setAdminCode('');
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminAccess(false);
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('adminAccess');
    setCurrentPage('home');
  };

  // Modal pour l'accès admin
  if (showAdminPrompt) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Accès Administrateur</h2>
            <p className="text-slate-400">Entrez le code d'accès pour continuer</p>
          </div>
          
          <form onSubmit={handleAdminAccess} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Code administrateur"
                className="w-full h-14 bg-slate-800 border border-slate-600 rounded-2xl px-6 text-white placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                disabled={isLoading}
              />
            </div>
            
            {showKeyError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Code d'accès invalide</span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowAdminPrompt(false)}
                className="flex-1 h-12 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all transform hover:scale-105"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !adminCode.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Accéder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Éléments de fond animés */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Grille de points */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:50px_50px]"></div>
          
          {/* Particules flottantes */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Section gauche - Informations */}
              <div className="text-center lg:text-left animate-in slide-in-from-left-8 duration-700">
                <div className="inline-flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8 animate-in fade-in-0 duration-500 delay-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-white/90 text-sm font-medium">Plateforme sécurisée et anonyme</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-4 duration-700 delay-300">
                  ABD
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 block animate-gradient">
                    LIVE
                  </span>
                </h1>
                
                <p className="text-xl text-slate-300 mb-8 leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-500">
                  La première plateforme de streaming entièrement privée. 
                  Regardez nos émissions en toute tranquillité.
                </p>
                
                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-700">
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">256-bit</div>
                    <div className="text-slate-400 text-sm">Chiffrement AES</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">100%</div>
                    <div className="text-slate-400 text-sm">Anonyme</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">24/7</div>
                    <div className="text-slate-400 text-sm">Disponible</div>
                  </div>
                </div>
                
                {/* Fonctionnalités */}
                <div className="space-y-4 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-900">
                  {[
                    { icon: Shield, text: "Chiffrement de bout en bout" },
                    { icon: Globe, text: "Accès mondial sans restriction" },
                    { icon: Users, text: "Communauté anonyme active" },
                    { icon: Star, text: "Qualité HD/4K garantie" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 text-slate-300 group hover:text-white transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section droite - Formulaire de connexion */}
              <div className="lg:pl-12 animate-in slide-in-from-right-8 duration-700 delay-300">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl hover:bg-white/10 transition-all duration-500">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Accès Sécurisé</h2>
                    <p className="text-slate-300">Entrez votre clé de déchiffrement</p>
                  </div>
                  
                  <form onSubmit={handleKeySubmit} className="space-y-6">
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Clé de déchiffrement"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 pr-14 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all group-hover:bg-white/10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {showKeyError && (
                      <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 text-red-300 text-sm backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                          <span>Clé de déchiffrement invalide</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isLoading || !keyInput.trim()}
                      className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Déchiffrement...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5" />
                          <span>Accéder au contenu</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Informations de sécurité */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-2 group hover:text-slate-300 transition-colors">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>SSL/TLS</span>
                      </div>
                      <div className="flex items-center space-x-2 group hover:text-slate-300 transition-colors">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                        <span>Zero-Log</span>
                      </div>
                      <div className="flex items-center space-x-2 group hover:text-slate-300 transition-colors">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-600"></div>
                        <span>P2P Sécurisé</span>
                      </div>
                      <div className="flex items-center space-x-2 group hover:text-slate-300 transition-colors">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-900"></div>
                        <span>Tor Compatible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-16 animate-in fade-in-0 duration-700 delay-1000">
              <div className="inline-flex items-center space-x-2 text-slate-400 group hover:text-slate-300 transition-colors">
                <span className="text-sm">Développé avec</span>
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse group-hover:scale-110 transition-transform"></div>
                <span className="text-sm">par</span>
                <span className="text-purple-400 font-semibold">ley</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Popup d'annonce globale */}
      {showPopup && currentPopup && (
        <PopupAnnouncement
          announcement={currentPopup}
          onClose={() => handleClosePopup(currentPopup.id)}
        />
      )}

      {/* Navigation moderne */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 animate-in slide-in-from-left-4 duration-500">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">ABD STREAM</span>
                <div className="text-xs text-slate-400">Plateforme privée</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 animate-in slide-in-from-top-4 duration-500 delay-200">
              {[
                { id: 'home', label: 'Accueil', icon: '🏠', action: () => setCurrentPage('home') },
                { id: 'streams', label: 'Streams', icon: '📺', action: () => setCurrentPage('streams') },
                { id: 'live', label: 'Live', icon: '🔴', action: () => setCurrentPage('live') }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right text-xs">
                {/* Affichage du nombre d'utilisateurs actifs dans la navigation */}
                <div className="text-white font-medium">{activeUsers} utilisateur{activeUsers > 1 ? 's' : ''}</div>
                <div className="text-green-400">● Connecté{activeUsers > 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 transform hover:scale-105 animate-in slide-in-from-right-4 duration-500 delay-300"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Barre de statut */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/30 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6 text-slate-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Serveurs opérationnels</span>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Latence: 45ms</span>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Qualité: HD</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            {/* Affichage du nombre d'utilisateurs actifs dans la barre de statut */}
            <span>{activeUsers} utilisateur{activeUsers > 1 ? 's' : ''} connectés</span>
            <button 
              onClick={() => window.location.reload()}
              className="hover:text-white transition-colors"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="animate-in fade-in-0 duration-500">
        {currentPage === 'home' && <HomePage activeUsers={activeUsers} />}
        {currentPage === 'streams' && <StreamsListPage />}
        {currentPage === 'live' && (
          <LiveStreamPage 
            allChatMessages={allChatMessages}
            wsService={wsServiceInstance}
            onDeleteMessage={handleDeleteChatMessage}
            onMuteUser={handleMuteChatUser}
            onBanUser={handleBanChatUser}
            onReportMessage={handleReportMessage}
            onAddMessage={addChatMessage}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            allChatMessages={allChatMessages}
            onDeleteMessage={handleDeleteChatMessage}
            onMuteUser={handleMuteChatUser}
            onBanUser={handleBanChatUser}
          />
        )}
        {currentPage === 'dmca' && <DMCAPage />}
        {currentPage === 'legal' && <LegalPage />}
      </main>
    </div>
  );
}

export default App;
