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
import { ChatMessage as ChatMessageType, Report } from '../types';
import { MODERATOR_PASSWORDS } from '../utils/constants';
import { formatTime, checkModeratorCredentials } from '../utils/helpers';
import { WebSocketService } from './services/websocket';

interface LiveStreamPageProps {
  allChatMessages: ChatMessageType[];
  wsService: WebSocketService | null;
  onDeleteMessage: (messageId: string) => void;
  onMuteUser: (username: string, moderatorUsername: string) => void;
  onBanUser: (username: string, moderatorUsername: string) => void;
  onReportMessage: (report: Report) => void;
  onAddMessage: (message: ChatMessageType) => void;
}

const LiveStreamPage: React.FC<LiveStreamPageProps> = ({
  allChatMessages,
  wsService,
  onDeleteMessage,
  onMuteUser,
  onBanUser,
  onReportMessage,
  onAddMessage
}) => {
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    likes: 0,
    duration: 0
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [viewers, setViewers] = useState(127);
  const [likes, setLikes] = useState(89);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userRole, setUserRole] = useState<'viewer' | 'moderator' | 'admin'>('viewer');
  const [showModPassword, setShowModPassword] = useState(false);
  const [modPassword, setModPassword] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessageType | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Messages automatiques du système
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => Math.max(50, prev + Math.floor(Math.random() * 20) - 10));
      
      if (Math.random() > 0.85) {
        const randomUsernames = [
          'Anonyme_' + Math.floor(Math.random() * 999),
          'Ghost_' + Math.floor(Math.random() * 999),
          'Viewer_' + Math.floor(Math.random() * 999)
        ];
        
        const randomMessages = [
          'Excellent stream ! 👏',
          'Merci pour le contenu de qualité',
          'Super travail ! 🔥',
          'J\'adore cette communauté',
          'Bravo pour l\'anonymat',
          'Qualité parfaite !',
          'Continue comme ça ! 💪'
        ];
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
        
        const newMessage: ChatMessageType = {
          id: Date.now().toString(),
          username: randomUsernames[Math.floor(Math.random() * randomUsernames.length)],
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date(),
          role: 'viewer',
          color: colors[Math.floor(Math.random() * colors.length)],
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        };
        
        onAddMessage(newMessage);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [allChatMessages]);

  const verifyModPassword = () => {
    const lowerUsername = username.toLowerCase();
    let expectedPassword = '';
    let role: 'viewer' | 'moderator' | 'admin' = 'viewer';

    if (lowerUsername.includes('admin')) {
      expectedPassword = MODERATOR_PASSWORDS.admin;
      role = 'admin';
    } else if (lowerUsername.includes('mod')) {
      expectedPassword = MODERATOR_PASSWORDS.mod;
      role = 'moderator';
    }

    if (modPassword === expectedPassword) {
      setUserRole(role);
      setShowModPassword(false);
      setModPassword('');
      return true;
    } else {
      alert('Mot de passe incorrect');
      return false;
    }
  };

  const setUserUsername = () => {
    if (username.trim()) {
      if (checkModeratorCredentials(username)) {
        setShowModPassword(true);
        return;
      }
      
      setIsUsernameSet(true);
      const welcomeMessage: ChatMessageType = {
        id: Date.now().toString(),
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
    if (verifyModPassword()) {
      setIsUsernameSet(true);
      
      const welcomeMessage: ChatMessageType = {
        id: Date.now().toString(),
        username: 'StreamBot',
        message: `👑 ${username} (${userRole.toUpperCase()}) a rejoint le chat !`,
        timestamp: new Date(),
        role: 'admin',
        isSystem: true,
        color: '#ef4444'
      };
      onAddMessage(welcomeMessage);
    }
  };

  const sendMessage = () => {
    if (message.trim() && isUsernameSet && wsService) {
      const newMessage: ChatMessageType = {
        id: Date.now().toString(),
        username: username,
        message: message.trim(),
        timestamp: new Date(),
        role: userRole,
        color: userRole === 'admin' ? '#ef4444' : userRole === 'moderator' ? '#8b5cf6' : '#3b82f6',
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      };
      
      // Envoyer via WebSocket
      wsService.sendMessage(newMessage);
      
      // Ajouter localement
      onAddMessage(newMessage);
      
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
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Vérifier
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
                  poster="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                >
                  <source src="http://localhost:8000/live/stream.m3u8" type="application/x-mpegURL" />
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
                🔴 Stream Live Anonyme Premium
              </h2>
              
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
            {/* Configuration du nom d'utilisateur */}
            {!isUsernameSet && (
              <div className="glass-dark bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-8 text-white animate-in slide-in-from-right-8 duration-700">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  👋 Rejoignez le Chat !
                </h3>
                <p className="text-indigo-100 text-sm mb-6">
                  Choisissez un nom d'utilisateur pour participer à la discussion en temps réel
                </p>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre pseudo..."
                    className="flex-1 h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder-white/60 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
                    maxLength={20}
                    onKeyPress={(e) => e.key === 'Enter' && setUserUsername()}
                  />
                  <button
                    onClick={setUserUsername}
                    disabled={!username.trim()}
                    className="h-12 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white px-6 rounded-xl font-medium transition-all transform hover:scale-105"
                  >
                    GO
                  </button>
                </div>
              </div>
            )}

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
                    currentUsername={username}
                    userRole={userRole}
                    onDeleteMessage={onDeleteMessage}
                    onMuteUser={(targetUsername) => onMuteUser(targetUsername, username)}
                    onBanUser={(targetUsername) => onBanUser(targetUsername, username)}
                    onReportMessage={(message) => {
                      setReportingMessage(message);
                      setShowReportModal(true);
                    }}
                  />
                ))}
              </div>
              
              {isUsernameSet ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Connecté en tant que {username}</span>
                      {userRole !== 'viewer' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userRole === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {userRole.toUpperCase()}
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
                        placeholder="Tapez votre message..."
                        className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 pr-12 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        maxLength={200}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <div className="relative">
                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-slate-400 hover:text-slate-300 transition-colors transform hover:scale-110"
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
                      disabled={!message.trim()}
                      className="h-12 w-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all transform hover:scale-105"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{message.length}/200</span>
                    <span className="text-green-400">● En ligne</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-sm">Configurez votre nom d'utilisateur pour participer au chat</p>
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