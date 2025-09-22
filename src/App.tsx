import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, Lock, Globe, Users, Star, ArrowRight, Sparkles } from 'lucide-react';
import HomePage from './components/HomePage';
import StreamsListPage from './components/StreamsListPage';
import AdminPage from './components/AdminPage';
import LiveStreamPage from './components/LiveStreamPage';
import AuthPage from './components/AuthPage';
import PopupAnnouncement from './components/modals/PopupAnnouncement';
import DMCAPage from './components/DMCAPage';
import LegalPage from './components/LegalPage';
import { PopupAnnouncement as PopupAnnouncementType, ChatMessage, Report, ConnectedUser } from './types';
import { WebSocketService } from './services/websocket'; // Importez le service WebSocket

type Page = 'home' | 'streaming' | 'admin' | 'streams' | 'live' | 'dmca' | 'legal';

// Fonction pour extraire la clé de stream de l'URL
function getStreamKeyFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/^\/live\/(.+)$/);
  return match ? match[1] : null;
}

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
  const [userRole, setUserRole] = useState<'viewer' | 'moderator' | 'admin'>('viewer');
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PopupAnnouncementType | null>(null);
  const [activeUsers, setActiveUsers] = useState(0); // État pour les utilisateurs actifs
  const [allConnectedUsers, setAllConnectedUsers] = useState<ConnectedUser[]>([]);
  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>([]);
  const [wsServiceInstance, setWsServiceInstance] = useState<WebSocketService | null>(null);
  const [liveStreamActive, setLiveStreamActive] = useState(false);

  // État pour stocker le nom d'utilisateur actuel (pour les mises à jour de page)
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // État pour la clé de stream actuelle
  const [currentStreamKey, setCurrentStreamKey] = useState<string | null>(null);

  // Effet pour l'authentification initiale
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated');
    const adminAuth = sessionStorage.getItem('adminAccess');
    const savedUser = sessionStorage.getItem('currentUser');
    const savedRole = sessionStorage.getItem('userRole');
    
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
    if (adminAuth === 'true') {
      setAdminAccess(true);
    }
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentUsername(user.username);
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }
    if (savedRole) {
      setUserRole(savedRole as 'viewer' | 'moderator' | 'admin');
    }

    // Vérifier si nous sommes sur une page de stream spécifique
    const streamKey = getStreamKeyFromUrl();
    if (streamKey) {
      setCurrentStreamKey(streamKey);
      setCurrentPage('live');
    }
  }, []);

  // Effet pour la logique WebSocket des utilisateurs actifs
  // Ce useEffect est maintenant au niveau supérieur et gère la connexion WebSocket
  useEffect(() => {
    // Fonction pour gérer les messages entrants du WebSocket
    const handleIncomingMessage = (data: any) => {
      try {
        if (data.type === 'user_count') {
          setActiveUsers(data.count);
        } else if (data.type === 'user_list') {
          // Convertir les dates ISO en objets Date
          const users = data.users.map((user: any) => ({
            ...user,
            connectTime: new Date(user.connectTime),
            lastActivity: new Date(user.lastActivity),
            muteEndTime: user.muteEndTime ? new Date(user.muteEndTime) : null
          }));
          setAllConnectedUsers(users);
        } else if (data.type === 'chat_message' && data.message) {
          // Ajouter le message de chat reçu à l'état global
          const messageWithDateObject = {
            ...data.message,
            timestamp: new Date(data.message.timestamp)
          };
          setAllChatMessages(prev => [...prev.slice(-49), messageWithDateObject]);
        } else if (data.type === 'banned') {
          // L'utilisateur a été banni
          alert('⚠️ ' + data.message);
          // Déconnecter l'utilisateur
          handleLogout();
        } else if (data.type === 'muted') {
          // L'utilisateur a été mute
          alert('🔇 ' + data.message);
        } else if (data.type === 'unmute_notification') {
          // L'utilisateur n'est plus mute
          alert('🔊 ' + data.message);
        } else if (data.type === 'message_deleted') {
          // Un message a été supprimé
          setAllChatMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        } else if (data.type === 'auth_response') {
          // Réponse d'authentification
          console.log('Auth response received:', data); // Log pour le débogage
          setIsLoading(false);
          if (data.success) {
            if (data.context === 'main_auth') {
              // Authentification principale réussie
              setIsAuthenticated(true);
              setUserRole(data.role);
              sessionStorage.setItem('authenticated', 'true');
              sessionStorage.setItem('userRole', data.role);
              setShowKeyError(false);
              setAuthError('');
            } else if (data.context === 'admin_access') {
              // Accès admin réussi
              setAdminAccess(true);
              setUserRole('admin');
              sessionStorage.setItem('adminAccess', 'true');
              sessionStorage.setItem('userRole', 'admin');
              setShowAdminPrompt(false);
              setCurrentPage('admin');
              setAuthError('');
            } else if (data.context === 'mod_auth') {
              // Authentification modérateur réussie (sera gérée par LiveStreamPage)
              setUserRole(data.role);
              setAuthError('');
            }
          } else {
            // Authentification échouée
            if (data.context === 'main_auth') {
              setShowKeyError(true);
              setAuthError(data.message || 'Clé d\'authentification incorrecte.');
              setTimeout(() => setShowKeyError(false), 4000);
            } else if (data.context === 'admin_access') {
              setAuthError(data.message || 'Code administrateur incorrect.');
              setTimeout(() => setAuthError(''), 5000);
            } else if (data.context === 'mod_auth') {
              setAuthError(data.message || 'Mot de passe modérateur incorrect.');
              setTimeout(() => setAuthError(''), 5000);
            }
          }
        } else if (data.type === 'login_response') {
          // Réponse de connexion
          setIsLoading(false);
          if (data.success) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
            setUserRole(data.user.role);
            setCurrentUsername(data.user.username);
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            sessionStorage.setItem('userRole', data.user.role);
            setAuthError('');
            setAuthSuccess('Connexion réussie ! Bienvenue ' + data.user.username);
            setTimeout(() => setAuthSuccess(''), 3000);
          } else {
            setAuthError(data.message || 'Erreur de connexion');
            setTimeout(() => setAuthError(''), 5000);
          }
        } else if (data.type === 'register_response') {
          // Réponse d'inscription
          setIsLoading(false);
          if (data.success) {
            setAuthSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            setTimeout(() => setAuthSuccess(''), 5000);
          } else {
            setAuthError(data.message || 'Erreur lors de la création du compte');
            setTimeout(() => setAuthError(''), 5000);
          }
        } else if (data.type === 'mute_notification') {
          // Notification de mute (quand l'utilisateur essaie d'envoyer un message)
          console.log('Mute notification:', data.message);
        } else if (data.type === 'stream_status') {
          // Mise à jour du statut du stream
          setLiveStreamActive(data.status === 'live');
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    try {
      const wsService = new WebSocketService(handleIncomingMessage);
      wsService.connect();
      setWsServiceInstance(wsService);


      return () => {
        try {
          wsService.disconnect();
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }, []); // Le tableau de dépendances vide assure qu'il ne s'exécute qu'une fois au montage

  // Effet pour envoyer les mises à jour de page au serveur
  useEffect(() => {
    if (wsServiceInstance && currentUsername && isAuthenticated) {
      wsServiceInstance.sendUserInfo(currentUsername, currentPage);
    }
  }, [currentPage, wsServiceInstance, currentUsername, isAuthenticated]);

  // Fonction pour mettre à jour le nom d'utilisateur actuel
  const updateCurrentUsername = (username: string) => {
    setCurrentUsername(username);
  };

  // Fonctions d'authentification
  const handleLogin = async (username: string, password: string) => {
    if (!wsServiceInstance) {
      setAuthError('Erreur de connexion au serveur');
      setTimeout(() => setAuthError(''), 3000);
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // Envoyer la requête de connexion au serveur
    wsServiceInstance.sendLogin(username, password);
  };

  const handleRegister = async (username: string, password: string) => {
    if (!wsServiceInstance) {
      setAuthError('Erreur de connexion au serveur');
      setTimeout(() => setAuthError(''), 3000);
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // Envoyer la requête d'inscription au serveur
    wsServiceInstance.sendRegister(username, password);
  };

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
    // Envoyer la demande de suppression au serveur
    if (wsServiceInstance) {
      wsServiceInstance.sendDeleteMessage(messageId);
    }
    // La suppression locale sera gérée par le message WebSocket de retour
  };

  const handleMuteChatUser = (targetUsername: string, moderatorUsername: string) => {
    // Trouver l'utilisateur cible
    const targetUser = allConnectedUsers.find(user => user.username === targetUsername);
    if (targetUser && wsServiceInstance) {
      // Envoyer l'action de mute au serveur
      wsServiceInstance.sendAdminAction('mute_user', targetUser.id, targetUsername);
    }
    
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
    // Trouver l'utilisateur cible
    const targetUser = allConnectedUsers.find(user => user.username === targetUsername);
    if (targetUser && wsServiceInstance) {
      // Envoyer l'action de ban au serveur
      wsServiceInstance.sendAdminAction('ban_user', targetUser.id, targetUsername);
    }
    
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

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Envoyer la demande d'authentification admin au serveur
    if (wsServiceInstance) {
      console.log('Client sending admin code:', adminCode); // Log pour le débogage
      wsServiceInstance.sendAuthentication('admin_access', 'admin', adminCode);
    } else {
      setAuthError('Erreur de connexion au serveur');
      setTimeout(() => setAuthError(''), 3000);
      setIsLoading(false);
    }
    
    setAdminCode('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAdminAccess(false);
    setCurrentUsername('');
    setUserRole('viewer');
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('adminAccess');
    sessionStorage.removeItem('userRole');
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
            
            {authError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>{authError}</span>
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
      <AuthPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={isLoading}
        error={authError}
        success={authSuccess}
      />
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
                { id: 'live', label: 'Chat', icon: '💬', action: () => setCurrentPage('live') }
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
            allConnectedUsers={allConnectedUsers}
            wsService={wsServiceInstance}
            currentUser={currentUser}
            onDeleteMessage={handleDeleteChatMessage}
            onMuteUser={handleMuteChatUser}
            onBanUser={handleBanChatUser}
            onReportMessage={handleReportMessage}
            onAddMessage={addChatMessage}
            userRole={userRole}
            streamKey={currentStreamKey}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            allChatMessages={allChatMessages}
            allConnectedUsers={allConnectedUsers}
            wsService={wsServiceInstance}
            onDeleteMessage={handleDeleteChatMessage}
            onMuteUser={handleMuteChatUser}
            onBanUser={handleBanChatUser}
            liveStreamActive={liveStreamActive}
          />
        )}
        {currentPage === 'dmca' && <DMCAPage />}
        {currentPage === 'legal' && <LegalPage />}
      </main>
    </div>
  );
}

export default App;
