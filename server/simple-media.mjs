import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎥 [Simple Media Server] Démarrage du serveur média simplifié...');

// Créer le dossier media s'il n'existe pas
const mediaDir = join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
  console.log('📁 Dossier media créé:', mediaDir);
}

// Serveur HTTP simple pour servir les fichiers média
const server = createServer((req, res) => {
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
        <head><title>ABD Media Server</title></head>
        <body>
          <h1>🎥 ABD Media Server</h1>
          <p>Serveur média simplifié en fonctionnement</p>
          <p>Port: 8000</p>
          <p>Status: ✅ Actif</p>
        </body>
      </html>
    `);
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      server: 'ABD Media Server',
      port: 8000,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Servir les fichiers statiques du dossier media
  const filePath = join(mediaDir, req.url.slice(1));
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = filePath.split('.').pop();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'mp4': contentType = 'video/mp4'; break;
      case 'm3u8': contentType = 'application/vnd.apple.mpegurl'; break;
      case 'ts': contentType = 'video/mp2t'; break;
      case 'html': contentType = 'text/html'; break;
      case 'js': contentType = 'application/javascript'; break;
      case 'css': contentType = 'text/css'; break;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
});

const PORT = 8015;
server.listen(PORT, () => {
  console.log('🌐 [Simple Media Server] Serveur HTTP démarré sur le port', PORT);
  console.log('📺 [Simple Media Server] Accès: http://localhost:' + PORT);
  console.log('📊 [Simple Media Server] Status: http://localhost:' + PORT + '/status');
  console.log('');
  console.log('✅ Serveur média simplifié prêt !');
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur média...');
  server.close(() => {
    console.log('✅ Serveur média arrêté');
    process.exit(0);
  });
});

export default server;