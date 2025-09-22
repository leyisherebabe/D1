import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, AlertTriangle } from 'lucide-react';
import { StreamSource } from '../types';

interface StreamPlayerProps {
  source: StreamSource | null;
  onError?: (error: string) => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ source, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (source && videoRef.current) {
      setIsLoading(true);
      setError(null);
      
      const video = videoRef.current;
      video.src = source.url;
      
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => {
        setIsLoading(false);
        video.play().catch(err => {
          setError('Erreur de lecture: ' + err.message);
          onError?.(err.message);
        });
      };
      const handleError = (e: any) => {
        setIsLoading(false);
        const errorMsg = 'Impossible de charger le flux vidéo';
        setError(errorMsg);
        onError?.(errorMsg);
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [source, onError]);

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
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (!source) {
    return (
      <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Aucun flux actif</h3>
          <p className="text-slate-400">Aucune source de streaming configurée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Erreur de lecture</h3>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            crossOrigin="anonymous"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Contrôles vidéo */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all"
              >
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMute}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all"
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
              
              <div className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg">
                {source.name}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all"
              >
                <Maximize className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StreamPlayer;