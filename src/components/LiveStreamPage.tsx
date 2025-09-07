import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  Users,
  Eye,
  MessageCircle,
  Send,
  Smile,
  Heart,
  Share2,
  Minimize,
  Shield,
  Sparkles
} from 'lucide-react';
import ChatMessage from './chat/ChatMessage';
import EmojiPicker from './chat/EmojiPicker';
import ReportModal from './modals/ReportModal';
import { ChatMessage as ChatMessageType, Report, ConnectedUser } from '../types';
import { formatTime, checkModeratorCredentials } from '../utils/helpers';
import { WebSocketService } from './services/websocket';

interface LiveStreamPageProps {
  allChatMessages: ChatMessageType[];
  allConnectedUsers: ConnectedUser[];
  wsService: WebSocketService | null;
  currentUser: any;
  onDeleteMessage: (messageId: string) => void;
  onMuteUser: (username: string, moderatorUsername: string) => void;
  onBanUser: (username: string, moderatorUsername: string) => void;
  onReportMessage: (report: Report) => void;
  onAddMessage: (message: ChatMessageType) => void;
  userRole: 'viewer' | 'moderator' | 'admin';
  streamKey?: string | null;
}

const LiveStreamPage: React.FC<LiveStreamPageProps> = ({
  allChatMessages,
  allConnectedUsers,
  wsService,
  currentUser,
  onDeleteMessage,
  onMuteUser,
  onBanUser,
  onReportMessage,
  onAddMessage,
  userRole: propUserRole,
  streamKey
}) => {
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    likes: 0,
    duration: 0
  });
  const [streamData, setStreamData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [viewers, setViewers] = useState(127);
  const [likes, setLikes] = useState(89);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localUserRole, setLocalUserRole] = useState<'viewer' | 'moderator' | 'admin'>('viewer');
  const [showModPassword, setShowModPassword] = useState(false);
  const [modPassword, setModPassword] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessageType | null>(null);
  const [isAuthenticatingMod, setIsAuthenticatingMod] = useState(false);

  // Vérifier si l'utilisateur actuel est mute
  const connectedUser = allConnectedUsers?.find(user => user.username === currentUser?.username);
  const isCurrentUserMuted = connectedUser?.isMuted || false;
  const muteEndTime = connectedUser?.muteEndTime;
  
  // Calculer le temps restant si l'utilisateur est mute
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    if (isCurrentUserMuted && muteEndTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const endTime = new Date(muteEndTime);
        const remaining = endTime.getTime() - now.getTime();
        
        if (remaining <= 0) {
          setTimeRemaining('');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          
          if (minutes > 0) {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isCurrentUserMuted, muteEndTime]);

  // Synchroniser le rôle local avec le rôle reçu d'App.tsx
  useEffect(() => {
    setLocalUserRole(propUserRole);
  }, [propUserRole]);

  // Gérer la réponse d'authentification des modérateurs
  useEffect(() => {
    if (isAuthenticatingMod) {
      if (propUserRole === 'moderator' || propUserRole === 'admin') {
        // Authentification réussie
        setIsUsernameSet(true);
        setShowModPassword(false);
        setModPassword('');
        setIsAuthenticatingMod(false);
        
        // Envoyer les informations utilisateur au serveur
        if (wsService) {
          wsService.sendUserInfo(username, 'live');
        }
        
        const welcomeMessage: ChatMessageType = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: 'StreamBot',
          message: `👑 ${username} (${propUserRole.toUpperCase()}) a rejoint le chat !`,
          timestamp: new Date(),
          role: 'admin',
          isSystem: true,
          color: '#ef4444'
        };
        onAddMessage(welcomeMessage);
      } else if (modPassword.length > 0) {
        // Authentification échouée
        alert('Mot de passe incorrect');
        setIsAuthenticatingMod(false);
      }
    }
  }, [propUserRole, isAuthenticatingMod, modPassword, username, onAddMessage, wsService]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Charger les données du stream si une clé est fournie
  useEffect(() => {
    if (streamKey && wsService) {
      // Rejoindre le stream spécifique
      wsService.send(JSON.stringify({
        type: 'join_stream',
        streamKey: streamKey
      }));

      // Écouter les réponses
      const originalCallback = wsService.onMessageCallback;
      wsService.onMessageCallback = (data) => {
        if (originalCallback) originalCallback(data);
        
        if (data.type === 'stream_joined' && data.success) {
          setStreamData(data.stream);
          setStreamStats({
            viewers: data.stream.viewers,
            likes: data.stream.likes || 0,
            duration: data.stream.duration
          });
        }
      };
    }

    return () => {
      if (streamKey && wsService) {
        // Quitter le stream
        wsService.send(JSON.stringify({
          type: 'leave_stream',
          streamKey: streamKey
        }));
      }
    };
  }, [streamKey, wsService]);

  // Mise à jour des viewers
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => Math.max(50, prev + Math.floor(Math.random() * 20) - 10));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [allChatMessages]);

  const setUserUsername = () => {
    if (username.trim()) {
      
      if (checkModeratorCredentials(username)) {
        setShowModPassword(true);
        return;
      }
      
      setIsUsernameSet(true);
      
      // Envoyer les informations utilisateur au serveur
      if (wsService) {
        wsService.sendUserInfo(username, 'live');
      }
      
      const welcomeMessage: ChatMessageType = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: 'StreamBot',
        message: `👋 Bienvenue ${username} dans le chat !`,
        timestamp: new Date(),
        role: 'admin',
        isSystem: true,
        color: '#ef4444'
      };
      onAddMessage(welcomeMessage);
    }
  };

  const handleModPasswordSubmit = () => {
    if (!wsService) {
      alert('Erreur: Connexion WebSocket non disponible.');
      return;
    }

    setIsAuthenticatingMod(true);

    const lowerUsername = username.toLowerCase();
    let roleToSend: 'viewer' | 'moderator' | 'admin' = 'viewer';
    if (lowerUsername.includes('admin')) {
      roleToSend = 'admin';
    } else if (lowerUsername.includes('mod')) {
      roleToSend = 'moderator';
    }

    // Envoyer la requête d'authentification au serveur
    wsService.sendAuthentication(username, roleToSend, modPassword);
  };

  const sendMessage = () => {
    if (message.trim() && isUsernameSet && wsService) {
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newMessage: ChatMessageType = {
        id: messageId,
        username: username,
        message: message.trim(),
        timestamp: new Date(),
        role: localUserRole,
        color: localUserRole === 'admin' ? '#ef4444' : localUserRole === 'moderator' ? '#8b5cf6' : '#3b82f6',
        ip: undefined // L'IP sera ajoutée par le serveur
      };
      
      // Envoyer via WebSocket
      wsService.sendMessage(newMessage);
      
      // Ne pas ajouter localement car le message sera reçu via WebSocket
      
      setMessage('');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      streamContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const likeStream = () => {
    setLikes(prev => prev + 1);
    
    // Animation de like
    const heartElement = document.createElement('div');
    heartElement.innerHTML = '❤️';
    heartElement.className = 'fixed text-2xl pointer-events-none z-50 animate-bounce';
    heartElement.style.left = Math.random() * window.innerWidth + 'px';
    heartElement.style.top = Math.random() * window.innerHeight + 'px';
    document.body.appendChild(heartElement);
    
    setTimeout(() => {
      document.body.removeChild(heartElement);
    }, 2000);
  };

  const shareStream = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ABD Stream Live',
        text: 'Regardez ce stream anonyme en direct !',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('🔗 Lien copié dans le presse-papiers !');
    }
  };

  const openSettings = () => {
    const settings = prompt('Paramètres de qualité:\n1. Auto\n2. 1080p\n3. 720p\n4. 480p\n\nEntrez votre choix (1-4):');
    if (settings) {
      const qualities = ['Auto', '1080p', '720p', '480p'];
      const selectedQuality = qualities[parseInt(settings) - 1];
      if (selectedQuality) {
        alert(`✅ Qualité changée vers: ${selectedQuality}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Modal de mot de passe modérateur */}
      {showModPassword && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="glass-dark border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Vérification Modérateur</h3>
              <p className="text-slate-400">Entrez le mot de passe pour confirmer votre statut</p>
            </div>
            <input
              type="password"
              value={modPassword}
              onChange={(e) => setModPassword(e.target.value)}
              placeholder="Mot de passe modérateur"
              className="w-full h-14 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 mb-6 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleModPasswordSubmit()}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModPassword(false);
                  setModPassword('');
                  setUsername('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={handleModPasswordSubmit}
                disabled={isAuthenticatingMod}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                {isAuthenticatingMod ? 'Vérification...' : 'Vérifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de signalement */}
      {showReportModal && reportingMessage && (
        <ReportModal
          message={reportingMessage}
          reporterUsername={username}
          onSubmit={onReportMessage}
          onClose={() => {
            setShowReportModal(false);
            setReportingMessage(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lecteur Principal */}
          <div className="lg:col-span-2">
            <div 
              ref={streamContainerRef}
              className="glass-dark border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-left-8 duration-700"
            >
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={isMuted}
                  controls
                  poster="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                >
                  <source src={streamData?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
                
                <div className="absolute top-6 left-6 flex items-center space-x-3">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    EN DIRECT
                  </div>
                  <div className="glass-dark text-white px-4 py-2 rounded-full text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    {viewers}
                  </div>
                  <div className="glass-dark text-white px-4 py-2 rounded-full text-sm flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-400" />
                    {likes}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={toggleMute}
                        className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 accent-cyan-500"
                      />
                    </div>
                    
                    <div className="flex-1"></div>
                    
                    <button 
                      onClick={likeStream}
                      className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110 group"
                    >
                      <Heart className="h-5 w-5 text-white group-hover:text-red-400 transition-colors" />
                    </button>
                    <button 
                      onClick={shareStream}
                      className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110"
                    >
                      <Share2 className="h-5 w-5 text-white" />
                    </button>
                    <button 
                      onClick={openSettings}
                      className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110"
                    >
                      <Settings className="h-5 w-5 text-white" />
                    </button>
                    <button 
                      onClick={toggleFullscreen}
                      className="glass-dark hover:bg-white/20 p-3 rounded-xl transition-all transform hover:scale-110"
                    >
                      {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations du Stream */}
            <div className="mt-8 glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <h2 className="text-3xl font-semibold text-white mb-6 flex items-center">
                <Sparkles className="h-8 w-8 mr-3 text-red-500" />
                🔴 {streamData?.title || 'Stream Live Anonyme Premium'}
              </h2>
              
              {streamKey && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Clé de Stream</h3>
                      <p className="text-slate-400">Cette URL est unique à ce stream</p>
                    </div>
                    <div className="text-right">
                      <code className="bg-slate-900 text-cyan-400 px-3 py-2 rounded-lg font-mono text-sm">
                        {streamKey}
                      </code>
                      <p className="text-xs text-slate-500 mt-1">
                        URL: /live/{streamKey}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Règles du Chat */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-cyan-400" />
                  📋 Règles de la Communauté
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                  {[
                    'Respectez les autres utilisateurs',
                    'Pas de spam ou de flood',
                    'Contenu approprié uniquement',
                    'Anonymat respecté'
                  ].map((rule, index) => (
                    <div key={index} className="flex items-center space-x-3 group hover:text-white transition-colors">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Chat */}
            <div className="glass-dark border border-slate-700/50 rounded-2xl p-6 animate-in slide-in-from-right-8 duration-700 delay-200">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <MessageCircle className="h-6 w-6 mr-3 text-purple-400" />
                Chat en Direct
                <span className="ml-auto text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                  {allChatMessages.length} messages
                </span>
              </h3>
              
              <div 
                ref={chatRef}
                className="space-y-3 max-h-96 overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
              >
                {allChatMessages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    currentUsername={currentUser?.username || ''}
                    userRole={localUserRole}
                    onDeleteMessage={onDeleteMessage}
                    onMuteUser={(targetUsername) => onMuteUser(targetUsername, currentUser?.username || '')}
                    onBanUser={(targetUsername) => onBanUser(targetUsername, currentUser?.username || '')}
                    onReportMessage={(message) => {
                      setReportingMessage(message);
                      setShowReportModal(true);
                    }}
                  />
                ))}
              </div>
              
              {currentUser ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Connecté en tant que {currentUser?.username}</span>
                      {localUserRole !== 'viewer' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          localUserRole === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {localUserRole.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                       placeholder={isCurrentUserMuted ? `Vous êtes mute pour encore ${timeRemaining}` : "Tapez votre message..."}
                        className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 pr-12 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        maxLength={200}
                        disabled={isCurrentUserMuted}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <div className="relative">
                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-slate-400 hover:text-slate-300 transition-colors transform hover:scale-110"
                            disabled={isCurrentUserMuted}
                          >
                            <Smile className="h-5 w-5" />
                          </button>
                          {showEmojiPicker && (
                            <EmojiPicker
                              onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
                              onClose={() => setShowEmojiPicker(false)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!message.trim() || isCurrentUserMuted}
                      className="h-12 w-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all transform hover:scale-105"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{message.length}/200</span>
                    <span className={isCurrentUserMuted ? "text-red-400" : "text-green-400"}>
                      ● {isCurrentUserMuted ? `Mute (${timeRemaining})` : "En ligne"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="glass-dark border border-slate-700/50 rounded-2xl p-8">
                    <MessageCircle className="h-16 w-16 mx-auto mb-6 text-slate-600" />
                    <h3 className="text-xl font-bold text-white mb-4">Rejoignez la Conversation !</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Connectez-vous ou créez un compte pour participer au chat en direct et échanger avec la communauté.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-4 text-sm text-slate-400 mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Chat en temps réel</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>Communauté active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <span>100% anonyme</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => window.location.href = '/'}
                          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                        >
                          <span>🚀 Se Connecter</span>
                        </button>
                        <button
                          onClick={() => window.location.href = '/'}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:border-white/20 flex items-center justify-center space-x-2"
                        >
                          <span>✨ Créer un Compte</span>
                        </button>
                      </div>
                      
                      <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2">💡 Pourquoi créer un compte ?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          <div className="flex items-center space-x-2">
                            <span>🔒</span>
                            <span>Sécurité maximale</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>👤</span>
                            <span>Identité préservée</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>💬</span>
                            <span>Chat illimité</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⚡</span>
                            <span>Accès instantané</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;