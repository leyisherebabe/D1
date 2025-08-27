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
  RefreshCw
} from 'lucide-react';
import { Stream } from '../types';
import { formatDuration } from '../utils/helpers';

const StreamsListPage = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Simulation de streams
    // Ne pas afficher de faux streams - liste vide par défaut
    const mockStreams: Stream[] = [];

    setStreams(mockStreams);

    // Mise à jour des viewers en temps réel
    const interval = setInterval(() => {
      setStreams(prev => prev.map(stream => ({
        ...stream,
        viewers: stream.isLive ? Math.max(0, stream.viewers + Math.floor(Math.random() * 10) - 4) : 0,
        duration: stream.isLive ? stream.duration + 1 : stream.duration
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const liveStreams = streams.filter(stream => stream.isLive);
  const topStream = liveStreams.sort((a, b) => b.viewers - a.viewers)[0];

  const refreshStreams = () => {
    // Simulation du rafraîchissement
    setStreams(prev => prev.map(stream => ({
      ...stream,
      viewers: stream.isLive ? Math.max(0, Math.floor(Math.random() * 200) + 10) : 0
    })));
    
    // Animation de rafraîchissement
    const button = document.querySelector('.refresh-button');
    if (button) {
      button.classList.add('animate-spin');
      setTimeout(() => {
        button.classList.remove('animate-spin');
      }, 1000);
    }
  };

  const watchStream = (streamId: string) => {
    // Redirection vers la page de stream
    window.location.href = '/live';
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
        {topStream && (
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-white/80">
                      <span className="bg-white/20 px-3 py-1 rounded-full">{topStream.category}</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">{topStream.quality}</span>
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
        )}

        {/* Contrôles */}
        <div className="glass-dark border border-slate-700/50 rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Tous les Streams</h2>
              <p className="text-slate-400 text-sm">{liveStreams.length} stream(s) en direct maintenant</p>
            </div>

            <div className="flex items-center space-x-2">
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

        {/* Message si aucun stream */}
        {liveStreams.length === 0 && (
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-16 text-center animate-in fade-in-0 duration-700">
            <WifiOff className="h-20 w-20 mx-auto mb-6 text-slate-600" />
            <h3 className="text-2xl font-semibold text-white mb-4">Aucun Stream en Direct</h3>
            <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
              Aucun stream n'est actuellement en ligne. Revenez plus tard pour découvrir du contenu exclusif !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={refreshStreams}
                className="refresh-button bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                Actualiser
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-medium transition-all hover:border-white/20"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamsListPage;