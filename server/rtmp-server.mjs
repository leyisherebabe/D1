import NodeMediaServer from 'node-media-server';
import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier media s'il n'existe pas
const mediaDir = join(__dirname, 'media', 'live');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
  console.log('📁 Dossier media créé:', mediaDir);
}

// FIX pour le bug "version is not defined"
global.version = '2.7.4';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8003,
    mediaroot: join(__dirname, 'media'),
    allow_origin: '*'
  },
  trans: {
    ffmpeg: process.platform === 'win32' ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        vc: 'libx264',
        vcParam: ['-preset', 'ultrafast', '-tune', 'zerolatency', '-g', '50'],
        ac: 'aac',
        acParam: ['-ab', '128k', '-ac', '2', '-ar', '44100'],
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]'
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

// Variables pour suivre les streams
const activeStreams = new Map();
const streamTimeouts = new Map();
const ffmpegProcesses = new Map();

// Fonction pour notifier le serveur WebSocket
async function notifyWebSocketServer(action, streamKey, data = {}) {
  try {
    const response = await axios.post('http://localhost:3000/api/stream/detect', {
      action: action,
      streamKey: streamKey,
      title: data.title || `Stream ${streamKey}`,
      description: data.description || 'Stream détecté automatiquement via RTMP',
      thumbnail: data.thumbnail || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&dpr=1',
      rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
      hlsUrl: `http://localhost:8001/live/${streamKey}.m3u8`
    });
    
    if (response.data.success) {
      console.log(`✅ [RTMP] Stream ${streamKey} détecté et notifié`);
    } else {
      console.log(`❌ [RTMP] Erreur lors de la notification: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`⚠️ [RTMP] Impossible de notifier le serveur WebSocket: ${error.message}`);
  }
}

// Fonction pour démarrer la conversion HLS manuelle avec FFmpeg
function startManualHLSConversion(streamKey) {
  const inputUrl = `rtmp://localhost:1935/live/${streamKey}`;
  const outputDir = join(mediaDir, streamKey);
  const outputPath = join(outputDir, 'index.m3u8');
  
  // Créer le dossier de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`🔄 [RTMP] Démarrage conversion HLS manuelle pour: ${streamKey}`);
  console.log(`📥 [RTMP] Input: ${inputUrl}`);
  console.log(`📤 [RTMP] Output: ${outputPath}`);
  
  const ffmpegArgs = [
    '-i', inputUrl,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '50',
    '-keyint_min', '25',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ac', '2',
    '-ar', '44100',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments',
    '-hls_allow_cache', '0',
    outputPath
  ];
  
  const ffmpeg = spawn('C:/ffmpeg/bin/ffmpeg.exe', ffmpegArgs);
  
  ffmpeg.stdout.on('data', (data) => {
    console.log(`📤 [FFmpeg ${streamKey}] stdout:`, data.toString().trim());
  });
  
  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Opening') || output.includes('frame=')) {
      console.log(`📥 [FFmpeg ${streamKey}]`, output);
    }
  });
  
  ffmpeg.on('close', (code) => {
    console.log(`🏁 [FFmpeg ${streamKey}] Processus terminé avec le code: ${code}`);
    ffmpegProcesses.delete(streamKey);
  });
  
  ffmpeg.on('error', (error) => {
    console.error(`❌ [FFmpeg ${streamKey}] Erreur:`, error.message);
  });
  
  ffmpegProcesses.set(streamKey, ffmpeg);
  
  // Vérifier la génération du fichier HLS
  setTimeout(() => {
    if (fs.existsSync(outputPath)) {
      console.log(`✅ [RTMP] Fichier HLS généré manuellement: ${streamKey}/index.m3u8`);
      console.log(`🎥 [RTMP] Stream disponible: http://localhost:8003/live/${streamKey}/index.m3u8`);
      
      // Notifier le serveur WebSocket
      notifyWebSocketServer('start', streamKey, {
        hlsUrl: `http://localhost:8003/live/${streamKey}/index.m3u8`
      });
    } else {
      console.log(`⚠️ [RTMP] Fichier HLS non généré pour: ${streamKey}`);
    }
  }, 5000);
}

// Fonction pour arrêter la conversion manuelle
function stopManualHLSConversion(streamKey) {
  const ffmpeg = ffmpegProcesses.get(streamKey);
  if (ffmpeg) {
    console.log(`⏹️ [RTMP] Arrêt de la conversion manuelle pour: ${streamKey}`);
    ffmpeg.kill('SIGTERM');
    ffmpegProcesses.delete(streamKey);
  }
}

// Fonction pour vérifier la génération HLS
function checkHLSGeneration(streamKey, maxAttempts = 15) {
  // node-media-server génère les fichiers dans un sous-dossier
  const hlsPath = join(mediaDir, streamKey, 'index.m3u8');
  const hlsDir = join(mediaDir, streamKey);
  let attempts = 0;
  
  // Debug: Vérifier immédiatement si le dossier existe
  console.log(`🔍 [RTMP] Vérification du dossier: ${hlsDir}`);
  if (!fs.existsSync(hlsDir)) {
    console.log(`📁 [RTMP] Création du dossier: ${hlsDir}`);
    try {
      fs.mkdirSync(hlsDir, { recursive: true });
    } catch (error) {
      console.log(`❌ [RTMP] Erreur création dossier: ${error.message}`);
    }
  }
  
  const checkInterval = setInterval(() => {
    attempts++;
    console.log(`⏳ [RTMP] Génération HLS en cours pour: ${streamKey} (tentative ${attempts}/${maxAttempts})`);
    console.log(`🔍 [RTMP] Recherche du fichier: ${hlsPath}`);
    
    // Debug: Lister le contenu du dossier à chaque tentative
    try {
      if (fs.existsSync(hlsDir)) {
        const files = fs.readdirSync(hlsDir);
        console.log(`📂 [RTMP] Fichiers dans ${streamKey}:`, files);
      } else {
        console.log(`❌ [RTMP] Dossier ${streamKey} n'existe pas encore`);
      }
    } catch (error) {
      console.log(`⚠️ [RTMP] Erreur lecture dossier: ${error.message}`);
    }
    
    if (fs.existsSync(hlsPath)) {
      clearInterval(checkInterval);
      console.log(`✅ [RTMP] Fichier HLS généré: ${streamKey}.m3u8`);
      console.log(`🎥 [RTMP] Stream ${streamKey} disponible sur: http://localhost:8003/live/${streamKey}/index.m3u8`);
      
      // Notifier le serveur WebSocket
      notifyWebSocketServer('start', streamKey, {
        hlsUrl: `http://localhost:8003/live/${streamKey}/index.m3u8`
      });
      
      return;
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log(`❌ [RTMP] Timeout: Fichier HLS non généré après ${maxAttempts * 2} secondes pour ${streamKey}`);
      console.log('🔧 [RTMP] Vérifiez que FFmpeg est installé et accessible');
      console.log(`📁 [RTMP] Dossier attendu: ${hlsDir}`);
      
      // Lister le contenu du dossier media pour debug
      try {
        const mediaContents = fs.readdirSync(mediaDir);
        console.log(`📂 [RTMP] Contenu du dossier media:`, mediaContents);
        
        if (fs.existsSync(hlsDir)) {
          const streamContents = fs.readdirSync(hlsDir);
          console.log(`📂 [RTMP] Contenu du dossier ${streamKey}:`, streamContents);
        }
      } catch (error) {
        console.log(`❌ [RTMP] Erreur lors de la lecture du dossier:`, error.message);
      }
    }
  }, 2000);
  
  // Stocker l'interval pour pouvoir l'annuler
  streamTimeouts.set(streamKey, checkInterval);
}

// Événements du serveur RTMP
nms.on('preConnect', (id, args) => {
  console.log(`[RTMP] 🔌 Client en connexion: ${id}`);
});

nms.on('postConnect', (id, args) => {
  console.log(`[RTMP] ✅ Client connecté: ${id}`);
});

nms.on('doneConnect', (id, args) => {
  console.log(`[RTMP] 👋 Client déconnecté: ${id}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  const streamKey = StreamPath.replace('/live/', '');
  console.log(`[RTMP] 🔴 Début de stream: ${StreamPath}`);
  console.log(`[RTMP] Clé de stream détectée: ${streamKey}`);
  
  // Ajouter à la liste des streams actifs
  activeStreams.set(streamKey, {
    id: id,
    streamPath: StreamPath,
    startTime: new Date(),
    isLive: true
  });
  
  // Démarrer la conversion HLS manuelle ET la vérification
  setTimeout(() => {
    startManualHLSConversion(streamKey);
    checkHLSGeneration(streamKey);
  }, 3000);
});

nms.on('postPublish', (id, StreamPath, args) => {
  const streamKey = StreamPath.replace('/live/', '');
  console.log(`[RTMP] ✅ Stream publié: ${StreamPath}`);
});

nms.on('donePublish', (id, StreamPath, args) => {
  const streamKey = StreamPath.replace('/live/', '');
  console.log(`[RTMP] ⏹️ Fin de stream: ${StreamPath}`);
  
  // Annuler la vérification HLS si elle est en cours
  if (streamTimeouts.has(streamKey)) {
    clearInterval(streamTimeouts.get(streamKey));
    streamTimeouts.delete(streamKey);
  }
  
  // Supprimer de la liste des streams actifs
  activeStreams.delete(streamKey);
  
  // Arrêter la conversion manuelle
  stopManualHLSConversion(streamKey);
  
  // Notifier le serveur WebSocket
  notifyWebSocketServer('stop', streamKey);
  
  // Nettoyer les fichiers HLS après un délai
  setTimeout(() => {
    const hlsPath = join(mediaDir, `${streamKey}.m3u8`);
    if (fs.existsSync(hlsPath)) {
      try {
        fs.unlinkSync(hlsPath);
        console.log(`🧹 [RTMP] Fichier HLS nettoyé: ${streamKey}.m3u8`);
      } catch (error) {
        console.log(`⚠️ [RTMP] Erreur lors du nettoyage: ${error.message}`);
      }
    }
  }, 30000); // 30 secondes après la fin du stream
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log(`[RTMP] 👁️ Viewer connecté: ${StreamPath}`);
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log(`[RTMP] ▶️ Lecture en cours: ${StreamPath}`);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log(`[RTMP] 👋 Viewer déconnecté: ${StreamPath}`);
});

// Démarrer le serveur
try {
  nms.run();
  
  console.log('🎥 [RTMP] Serveur RTMP démarré avec succès');
  console.log('📡 [RTMP] RTMP Server: rtmp://localhost:1935/live');
  console.log('🌐 [RTMP] HTTP Server: http://localhost:8001');
  console.log('🔧 [RTMP] FFmpeg: C:/ffmpeg/bin/ffmpeg.exe');
  console.log('');
  console.log('📋 [RTMP] Configuration OBS:');
  console.log('   - Serveur: rtmp://localhost:1935/live');
  console.log('   - Clé de stream: votre_cle_personnalisee');
  console.log('');
  console.log('✅ [RTMP] Serveur prêt à recevoir les streams d\'OBS');
  
} catch (error) {
  console.error('❌ [RTMP] Erreur lors du démarrage:', error.message);
  process.exit(1);
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur RTMP...');
  
  // Nettoyer tous les timeouts
  streamTimeouts.forEach((timeout) => {
    clearInterval(timeout);
  });
  
  // Arrêter tous les processus FFmpeg
  ffmpegProcesses.forEach((ffmpeg, streamKey) => {
    console.log(`⏹️ Arrêt du processus FFmpeg pour: ${streamKey}`);
    ffmpeg.kill('SIGTERM');
  });
  
  // Arrêter le serveur
  try {
    nms.stop();
  } catch (error) {
    console.log('Erreur lors de l\'arrêt:', error.message);
  }
  
  console.log('✅ Serveur RTMP arrêté');
  process.exit(0);
});

export default nms;