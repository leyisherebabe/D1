import { spawn } from 'child_process';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier media s'il n'existe pas
const mediaDir = join(__dirname, 'media', 'live');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
  console.log('📁 Dossier media créé:', mediaDir);
}

// Variables pour suivre les streams
const activeStreams = new Map();
const ffmpegProcesses = new Map();

console.log('🎥 [Simple RTMP] Serveur RTMP simplifié démarré');
console.log('📡 [Simple RTMP] En attente de streams...');
console.log('');
console.log('📋 [Simple RTMP] Pour tester manuellement :');
console.log('   1. Utilisez OBS avec : rtmp://localhost:1935/live/VOTRE_CLE');
console.log('   2. Ou testez avec FFmpeg :');
console.log('      ffmpeg -re -i video.mp4 -c copy -f flv rtmp://localhost:1935/live/test');
console.log('');

// Fonction pour notifier le serveur WebSocket
async function notifyWebSocketServer(action, streamKey, data = {}) {
  try {
    const response = await axios.post('http://localhost:3000/api/stream/detect', {
      action: action,
      streamKey: streamKey,
      title: data.title || `Stream ${streamKey}`,
      description: data.description || 'Stream détecté automatiquement',
      thumbnail: data.thumbnail || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&dpr=1',
      rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
      hlsUrl: `http://localhost:8001/live/${streamKey}.m3u8`
    });
    
    if (response.data.success) {
      console.log(`✅ [Simple RTMP] Stream ${streamKey} détecté et notifié`);
    } else {
      console.log(`❌ [Simple RTMP] Erreur lors de la notification: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`⚠️ [Simple RTMP] Impossible de notifier le serveur WebSocket: ${error.message}`);
  }
}

// Fonction pour démarrer la conversion HLS
function startHLSConversion(streamKey, inputUrl) {
  const outputPath = join(mediaDir, `${streamKey}.m3u8`);
  
  console.log(`🔄 [Simple RTMP] Démarrage conversion HLS pour: ${streamKey}`);
  console.log(`📥 [Simple RTMP] Input: ${inputUrl}`);
  console.log(`📤 [Simple RTMP] Output: ${outputPath}`);
  
  const ffmpegArgs = [
    '-i', inputUrl,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
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
    
    // Nettoyer le fichier HLS
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
          console.log(`🧹 [Simple RTMP] Fichier HLS nettoyé: ${streamKey}.m3u8`);
        } catch (error) {
          console.log(`⚠️ [Simple RTMP] Erreur lors du nettoyage: ${error.message}`);
        }
      }
    }, 30000);
  });
  
  ffmpeg.on('error', (error) => {
    console.error(`❌ [FFmpeg ${streamKey}] Erreur:`, error.message);
  });
  
  ffmpegProcesses.set(streamKey, ffmpeg);
  
  // Vérifier la génération du fichier HLS
  setTimeout(() => {
    if (fs.existsSync(outputPath)) {
      console.log(`✅ [Simple RTMP] Fichier HLS généré: ${streamKey}.m3u8`);
      console.log(`🎥 [Simple RTMP] Stream disponible: http://localhost:8001/live/${streamKey}.m3u8`);
      
      // Notifier le serveur WebSocket
      notifyWebSocketServer('start', streamKey);
    } else {
      console.log(`⚠️ [Simple RTMP] Fichier HLS non généré pour: ${streamKey}`);
    }
  }, 5000);
}

// Fonction pour arrêter la conversion
function stopHLSConversion(streamKey) {
  const ffmpeg = ffmpegProcesses.get(streamKey);
  if (ffmpeg) {
    console.log(`⏹️ [Simple RTMP] Arrêt de la conversion pour: ${streamKey}`);
    ffmpeg.kill('SIGTERM');
    ffmpegProcesses.delete(streamKey);
    
    // Notifier le serveur WebSocket
    notifyWebSocketServer('stop', streamKey);
  }
}

// Serveur HTTP pour servir les fichiers HLS
const httpServer = createServer((req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Simple RTMP Server</title></head>
        <body>
          <h1>🎥 Simple RTMP Server</h1>
          <p>Serveur RTMP simplifié en fonctionnement</p>
          <p>Port: 8001</p>
          <p>Status: ✅ Actif</p>
          <h2>Streams actifs:</h2>
          <ul>
            ${Array.from(activeStreams.keys()).map(key => 
              `<li><a href="/live/${key}.m3u8">${key}</a></li>`
            ).join('')}
          </ul>
        </body>
      </html>
    `);
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      server: 'Simple RTMP Server',
      port: 8001,
      activeStreams: Array.from(activeStreams.keys()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // API pour démarrer un stream manuellement
  if (req.url === '/api/start-stream' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const streamKey = data.streamKey || 'test';
        const inputUrl = data.inputUrl || `rtmp://localhost:1935/live/${streamKey}`;
        
        console.log(`🚀 [API] Démarrage manuel du stream: ${streamKey}`);
        startHLSConversion(streamKey, inputUrl);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `Stream ${streamKey} démarré`,
          hlsUrl: `http://localhost:8001/live/${streamKey}.m3u8`
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message }));
      }
    });
    return;
  }

  // Servir les fichiers HLS
  if (req.url.startsWith('/live/')) {
    const fileName = req.url.replace('/live/', '');
    const filePath = join(mediaDir, fileName);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = fileName.split('.').pop();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case 'm3u8': contentType = 'application/vnd.apple.mpegurl'; break;
        case 'ts': contentType = 'video/mp2t'; break;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const HTTP_PORT = 8001;
httpServer.listen(HTTP_PORT, () => {
  console.log('🌐 [Simple RTMP] Serveur HTTP démarré sur le port', HTTP_PORT);
  console.log('📺 [Simple RTMP] Accès: http://localhost:' + HTTP_PORT);
  console.log('📊 [Simple RTMP] Status: http://localhost:' + HTTP_PORT + '/status');
  console.log('');
  console.log('🎯 [Simple RTMP] Pour tester :');
  console.log('   curl -X POST http://localhost:8001/api/start-stream -H "Content-Type: application/json" -d \'{"streamKey":"test"}\'');
  console.log('');
  console.log('✅ Serveur Simple RTMP prêt !');
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur Simple RTMP...');
  
  // Arrêter tous les processus FFmpeg
  ffmpegProcesses.forEach((ffmpeg, streamKey) => {
    console.log(`⏹️ Arrêt du processus FFmpeg pour: ${streamKey}`);
    ffmpeg.kill('SIGTERM');
  });
  
  // Fermer le serveur HTTP
  httpServer.close(() => {
    console.log('✅ Serveur Simple RTMP arrêté');
    process.exit(0);
  });
});

export default httpServer;