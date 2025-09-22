import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Eye, 
  Clock,
  Users,
  Wifi,
  WifiOff,
  Grid,
  List,
  Star,
  MoreVertical,
  Sparkles,
  TrendingUp,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { Stream } from '../types';
import { formatDuration } from '../utils/helpers';

const StreamsListPage = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [streamKeys, setStreamKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les streams depuis localStorage (créés par les admins)
    const loadStreams = () => {
      const savedStreamKeys = JSON.parse(localStorage.getItem('streamKeys') || '[]');
      setStreamKeys(savedStreamKeys);
      
      // Convertir les clés de stream en format Stream pour l'affichage
      const formattedStreams = savedStreamKeys.map((streamKey: any) => ({
        id: streamKey.id,
        key: streamKey.key,
        title: streamKey.title,
        thumbnail: streamKey.thumbnail,
        isLive: streamKey.isActive,
        viewers: Math.floor(Math.random() * 100) + 10, // Simulation pour la démo
        duration: streamKey.isActive ? Math.floor((Date.now() - new Date(streamKey.createdAt).getTime()) / 1000) : 0,
        startTime: streamKey.isActive ? new Date(streamKey.createdAt) : new Date(),
        category: 'Live Stream',
        quality: '1080p',
        tags: ['live', 'anonyme'],
        description: streamKey.description
      }));
      
      setStreams(formattedStreams);
      setIsLoading(false);
    };

    loadStreams();
    
    // Actualiser toutes les 10 secondes
    const interval = setInterval(loadStreams, 10000);
    
    return () => clearInterval(interval);
  }, []);


  const refreshStreams = () => {
    // Recharger depuis localStorage
    const savedStreamKeys = JSON.parse(localStorage.getItem('streamKeys') || '[]');
    setStreamKeys(savedStreamKeys);
    
    const formattedStreams = savedStreamKeys.map((streamKey: any) => ({
      id: streamKey.id,
      key: streamKey.key,
      title: streamKey.title,
      thumbnail: streamKey.thumbnail,
      isLive: streamKey.isActive,
      viewers: Math.floor(Math.random() * 100) + 10,
      duration: streamKey.isActive ? Math.floor((Date.now() - new Date(streamKey.createdAt).getTime()) / 1000) : 0,
      startTime: streamKey.isActive ? new Date(streamKey.createdAt) : new Date(),
      category: 'Live Stream',
      quality: '1080p',
      tags: ['live', 'anonyme'],
      description: streamKey.description
    }));
    
    setStreams(formattedStreams);
    
    // Animation de rafraîchissement
    const button = document.querySelector('.refresh-button');
    if (button) {
      button.classList.add('animate-spin');
      setTimeout(() => {
        button.classList.remove('animate-spin');
      }, 1000);
    }
  };


  const liveStreams = streams.filter(stream => stream.isLive);
  const topStream = liveStreams.sort((a, b) => b.viewers - a.viewers)[0];

  const watchStream = (streamId: string) => {
    const stream = streams.find(s => s.id === streamId);
    if (stream) {
      // Redirection vers la page de stream avec la clé
      window.location.href = `/live/${(stream as any).key}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec design futuriste */}
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                  <Sparkles className="h-8 w-8 mr-3 text-purple-400" />
                  Streams en Direct
                </h1>
                <p className="text-slate-400 text-lg">Découvrez les streams actuellement en ligne</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{liveStreams.length}</div>
                <div className="text-slate-400">Stream(s) actif(s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stream principal (le plus populaire) */}
        {streams.length > 0 && streams.some(s => s.isLive) && (() => {
          const topStream = streams.filter(s => s.isLive).sort((a, b) => b.viewers - a.viewers)[0];
          return topStream ? (
          <div className="glass-dark border border-slate-700/50 rounded-3xl overflow-hidden mb-8 animate-in slide-in-from-left-8 duration-700 delay-200">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-600/20 p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3 text-white">
                <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
                <span className="font-semibold text-lg">Stream le Plus Populaire</span>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="relative">
              <img 
                src={topStream.thumbnail} 
                alt={topStream.title}
                className="w-full h-64 md:h-80 object-cover"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40">
                <div className="absolute top-6 left-6 flex items-center space-x-3">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </div>
                  <div className="glass-dark text-white px-4 py-2 rounded-full text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    {topStream.viewers}
                  </div>
                  <div className="glass-dark text-white px-4 py-2 rounded-full text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDuration(topStream.duration)}
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-3xl font-bold text-white mb-4">{topStream.title}</h3>
                  {(topStream as any).description && (
                    <p className="text-lg text-white/80 mb-4">{(topStream as any).description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-white/80">
                      <span className="bg-white/20 px-3 py-1 rounded-full">{topStream.category}</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">{topStream.quality}</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">Clé: {(topStream as any).key}</span>
                    </div>
                    
                    <button 
                      onClick={() => watchStream(topStream.id)}
                      className="glass-dark hover:bg-white/20 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 transform hover:scale-105"
                    >
                      <Play className="h-5 w-5" />
                      <span>Regarder</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ) : null;
        })()}

        {/* Contrôles */}
        <div className="glass-dark border border-slate-700/50 rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Tous les Streams</h2>
              <p className="text-slate-400 text-sm">
                {streams.filter(s => s.isLive).length} stream(s) en direct • {streams.length} stream(s) total
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={refreshStreams}
                className="refresh-button bg-slate-700 hover:bg-slate-600 text-slate-300 p-3 rounded-xl transition-all transform hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all transform hover:scale-105 ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all transform hover:scale-105 ${
                  viewMode === 'list' 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>


        {/* Liste des streams */}
        {isLoading ? (
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-16 text-center animate-in fade-in-0 duration-700">
            <div className="w-16 h-16 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-semibold text-white mb-4">Chargement des Streams...</h3>
            <p className="text-slate-400">Récupération des streams en cours</p>
          </div>
        ) : streams.length > 0 ? (
          <div className={`grid gap-6 mb-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {streams.map((stream) => (
              <div key={stream.id} className="glass-dark border border-slate-700/50 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 animate-in slide-in-from-bottom-4">
                <div className="relative">
                  <img 
                    src={stream.thumbnail} 
                    alt={stream.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    {stream.isLive ? (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        LIVE
                      </div>
                    ) : (
                      <div className="bg-slate-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        HORS LIGNE
                      </div>
                    )}
                    <div className="glass-dark text-white px-3 py-1 rounded-full text-xs flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {stream.viewers}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={() => watchStream(stream.id)}
                      className={`backdrop-blur-sm text-white p-3 rounded-full transition-all transform hover:scale-110 ${
                        stream.isLive 
                          ? 'bg-green-500/80 hover:bg-green-500' 
                          : 'bg-slate-600/80 hover:bg-slate-600'
                      }`}
                    >
                      <Play className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{stream.title}</h3>
                  {(stream as any).description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{(stream as any).description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span className="bg-slate-800/50 px-2 py-1 rounded">{stream.category}</span>
                    <span className="bg-slate-800/50 px-2 py-1 rounded">{stream.quality}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Clé: {(stream as any).key}</span>
                    <span className={stream.isLive ? "text-green-400" : "text-slate-500"}>
                      {stream.isLive ? `⏱️ ${formatDuration(stream.duration)}` : '⏹️ Arrêté'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Message si aucun stream */
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-16 text-center animate-in fade-in-0 duration-700">
            <MessageCircle className="h-20 w-20 mx-auto mb-6 text-slate-600" />
            <h3 className="text-2xl font-semibold text-white mb-4">Aucun Stream Disponible</h3>
            <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
              Aucun stream n'a été créé pour le moment. Les administrateurs peuvent créer des streams via le panel d'administration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-medium transition-all hover:border-white/20"
              >
                Retour à l'accueil
              </button>
              <button 
                onClick={refreshStreams}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Actualiser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamsListPage;