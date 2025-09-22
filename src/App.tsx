import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, Users, Crown, LogOut } from 'lucide-react';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import StreamPlayer from './components/StreamPlayer';
import { WebSocketService } from './services/websocket';
import { User, ConnectedUser, ChatMessage, StreamSource } from './types';
import { generateSecureId, checkPermission } from './utils';

type Page = 'home' | 'admin';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminAccess, setAdminAccess] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // États WebSocket et données
  const [wsServiceInstance, setWsServiceInstance] = useState<WebSocketService | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // État du streaming
  const [currentStreamSource, setCurrentStreamSource] = useState<StreamSource | null>(null);

  // Initialisation WebSocket
  useEffect(() => {
    const handleIncomingMessage = (data: any) => {
      try {
        switch (data.type) {
          case 'user_count':
            setActiveUsers(data.count);
            break;
          case 'user_list':
            const users = data.users.map((user: any) => ({
              ...user,
              connectTime: new Date(user.connectTime),
              lastActivity: new Date(user.lastActivity),
              muteEndTime: user.muteEndTime ? new Date(user.muteEndTime) : null
            }));
            setConnectedUsers(users);
            break;
          case 'chat_message':
            if (data.message) {
              const messageWithDate = {
                ...data.message,
                timestamp: new Date(data.message.timestamp)
              };
              setChatMessages(prev => [...prev.slice(-49), messageWithDate]);
            }
            break;
          case 'auth_response':
            setIsLoading(false);
            if (data.success) {
              if (data.context === 'admin_access') {
                setAdminAccess(true);
                setShowAdminPrompt(false);
                setCurrentPage('admin');
                sessionStorage.setItem('adminAccess', 'true');
              }
              setAuthError('');
            } else {
              setAuthError(data.message || 'Authentification échouée');
              setTimeout(() => setAuthError(''), 5000);
            }
            break;
          case 'login_response':
            setIsLoading(false);
            if (data.success) {
              setIsAuthenticated(true);
              setCurrentUser(data.user);
              sessionStorage.setItem('authenticated', 'true');
              sessionStorage.setItem('currentUser', JSON.stringify(data.user));
              setAuthSuccess('Connexion réussie !');
              setTimeout(() => setAuthSuccess(''), 3000);
            } else {
              setAuthError(data.message || 'Erreur de connexion');
              setTimeout(() => setAuthError(''), 5000);
            }
            break;
          case 'register_response':
            setIsLoading(false);
            if (data.success) {
              setAuthSuccess('Compte créé avec succès !');
              setTimeout(() => setAuthSuccess(''), 5000);
            } else {
              setAuthError(data.message || 'Erreur lors de la création du compte');
              setTimeout(() => setAuthError(''), 5000);
            }
            break;
          case 'banned':
            alert('⚠️ ' + data.message);
            handleLogout();
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    const wsService = new WebSocketService(handleIncomingMessage);
    wsService.connect();
    setWsServiceInstance(wsService);

    return () => {
      wsService.disconnect();
    };
  }, []);

  // Vérification de l'authentification au chargement
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated');
    const adminAuth = sessionStorage.getItem('adminAccess');
    const savedUser = sessionStorage.getItem('currentUser');
    
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
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }
  }, []);

  // Détection de la combinaison secrète pour l'admin (Ctrl+Shift+A)
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

  // Fonctions d'authentification
  const handleLogin = async (username: string, password: string) => {
    if (!wsServiceInstance) {
      setAuthError('Erreur de connexion au serveur');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    wsServiceInstance.sendLogin(username, password);
  };

  const handleRegister = async (username: string, password: string) => {
    if (!wsServiceInstance) {
      setAuthError('Erreur de connexion au serveur');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setAuthSuccess('');
    wsServiceInstance.sendRegister(username, password);
  };

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsServiceInstance) {
      setAuthError('Erreur de connexion au serveur');
      return;
    }

    setIsLoading(true);
    wsServiceInstance.sendAuthentication('admin_access', 'admin', adminCode);
    setAdminCode('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAdminAccess(false);
    sessionStorage.clear();
    setCurrentPage('home');
  };

  const handleStreamSourceChange = (source: StreamSource | null) => {
    setCurrentStreamSource(source);
  };

  // Modal d'accès admin
  if (showAdminPrompt) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Accès Administrateur</h2>
            <p className="text-slate-400">Entrez le code d'accès pour continuer</p>
          </div>
          
          <form onSubmit={handleAdminAccess} className="space-y-6">
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Code administrateur"
              className="w-full h-14 bg-slate-800 border border-slate-600 rounded-2xl px-6 text-white placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
              disabled={isLoading}
            />
            
            {authError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
                {authError}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowAdminPrompt(false)}
                className="flex-1 h-12 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !adminCode.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
              >
                {isLoading ? 'Vérification...' : 'Accéder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Page d'authentification
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
      {/* Navigation sécurisée */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">ABD STREAM</span>
                <div className="text-xs text-slate-400">Plateforme sécurisée</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-300">{activeUsers} connecté(s)</span>
              </div>
              
              {adminAccess && (
                <button
                  onClick={() => setCurrentPage(currentPage === 'admin' ? 'home' : 'admin')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    currentPage === 'admin'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="text-right">
                  <div className="text-white font-medium">{currentUser?.username}</div>
                  <div className={`text-xs ${
                    currentUser?.role === 'admin' ? 'text-red-400' :
                    currentUser?.role === 'moderator' ? 'text-purple-400' :
                    'text-slate-400'
                  }`}>
                    {currentUser?.role?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="animate-in fade-in-0 duration-500">
        {currentPage === 'admin' && adminAccess ? (
          <AdminPanel
            currentUser={currentUser}
            connectedUsers={connectedUsers}
            chatMessages={chatMessages}
            wsService={wsServiceInstance}
            onStreamSourceChange={handleStreamSourceChange}
          />
        ) : (
          /* Page d'accueil avec lecteur de stream */
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-8">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-3xl p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    Bienvenue sur ABD Stream
                  </h1>
                  <p className="text-xl text-slate-300">
                    Plateforme de streaming sécurisée et anonyme
                  </p>
                </div>
                
                {/* Lecteur de stream */}
                <div className="mb-8">
                  <StreamPlayer 
                    source={currentStreamSource}
                    onError={(error) => console.error('Stream error:', error)}
                  />
                </div>
                
                {/* Informations sur le stream actuel */}
                {currentStreamSource && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      🔴 {currentStreamSource.name}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Type: {currentStreamSource.type.toUpperCase()} • 
                      Créé par {currentStreamSource.createdBy}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span>URL: {currentStreamSource.url}</span>
                    </div>
                  </div>
                )}
                
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{activeUsers}</div>
                    <div className="text-slate-400 text-sm">Utilisateurs connectés</div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">100%</div>
                    <div className="text-slate-400 text-sm">Sécurisé</div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">∞</div>
                    <div className="text-slate-400 text-sm">Anonymat</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;