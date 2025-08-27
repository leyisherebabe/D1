const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeUsers = 0;
const connectedUsers = new Map(); // Map pour stocker les informations des utilisateurs connectés

// Servir des fichiers statiques si nécessaire
app.use(express.static('public'));

// Fonction pour générer un ID unique
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Fonction pour obtenir l'adresse IP du client
function getClientIP(req) {
  return req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
}

// Fonction pour diffuser la liste des utilisateurs à tous les clients
function broadcastUserList() {
  const userList = Array.from(connectedUsers.values());
  const message = JSON.stringify({
    type: 'user_list',
    users: userList
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  activeUsers++;
  
  // Générer un ID unique pour cet utilisateur
  const userId = generateUserId();
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Créer l'objet utilisateur initial
  const userInfo = {
    id: userId,
    username: 'Anonyme_' + Math.floor(Math.random() * 9999),
    ip: clientIP,
    userAgent: userAgent,
    connectTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    page: 'home'
  };
  
  // Stocker l'utilisateur dans la Map
  connectedUsers.set(ws, userInfo);
  
  console.log('Client connected. Total active users:', activeUsers);
  console.log('User info:', userInfo);

  // Envoyer le nombre d'utilisateurs actifs au nouveau client
  ws.send(JSON.stringify({ type: 'user_count', count: activeUsers }));

  // Diffuser la liste des utilisateurs mise à jour
  broadcastUserList();

  // Diffuser le nouveau nombre d'utilisateurs à tous les clients
  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'user_count', count: activeUsers }));
    }
  });

  ws.on('message', message => {
    console.log('Received message:', message.toString());
    
    try {
      const parsedMessage = JSON.parse(message.toString());
      
      // Mettre à jour la dernière activité de l'utilisateur
      if (connectedUsers.has(ws)) {
        const userInfo = connectedUsers.get(ws);
        userInfo.lastActivity = new Date().toISOString();
        connectedUsers.set(ws, userInfo);
      }
      
      if (parsedMessage.type === 'chat_message') {
        console.log('Broadcasting chat message from:', parsedMessage.message?.username);
        
        // Re-diffuser le message de chat à tous les clients connectés
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(parsedMessage));
          }
        });
      } else if (parsedMessage.type === 'user_info') {
        // Mettre à jour les informations de l'utilisateur
        if (connectedUsers.has(ws)) {
          const userInfo = connectedUsers.get(ws);
          if (parsedMessage.username) {
            userInfo.username = parsedMessage.username;
          }
          if (parsedMessage.page) {
            userInfo.page = parsedMessage.page;
          }
          userInfo.lastActivity = new Date().toISOString();
          connectedUsers.set(ws, userInfo);
          
          console.log('Updated user info:', userInfo);
          
          // Diffuser la liste des utilisateurs mise à jour
          broadcastUserList();
        }
      } else {
        console.log('Received non-handled message type:', parsedMessage.type);
      }
    } catch (error) {
      console.warn('Received invalid JSON message:', error.message);
    }
  });

  ws.on('close', () => {
    activeUsers--;
    
    // Supprimer l'utilisateur de la Map
    if (connectedUsers.has(ws)) {
      const userInfo = connectedUsers.get(ws);
      console.log('User disconnected:', userInfo.username);
      connectedUsers.delete(ws);
    }
    
    console.log('Client disconnected. Total active users:', activeUsers);
    
    // Diffuser la liste des utilisateurs mise à jour
    broadcastUserList();
    
    // Diffuser le nouveau nombre d'utilisateurs à tous les clients restants
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'user_count', count: activeUsers }));
      }
    });
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
    
    // Nettoyer en cas d'erreur
    if (connectedUsers.has(ws)) {
      connectedUsers.delete(ws);
      activeUsers = Math.max(0, activeUsers - 1);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});