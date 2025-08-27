const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeUsers = 0;

// Servir des fichiers statiques si nécessaire (par exemple, pour une page d'accueil simple)
app.use(express.static('public'));

wss.on('connection', ws => {
  activeUsers++;
  console.log('Client connected. Total active users:', activeUsers);

  // Envoyer le nombre d'utilisateurs actifs au nouveau client
  ws.send(JSON.stringify({ type: 'user_count', count: activeUsers }));

  // Diffuser le nouveau nombre d'utilisateurs à tous les clients existants
  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'user_count', count: activeUsers }));
    }
  });

  ws.on('message', message => {
    console.log('Received message:', message.toString());
    
    try {
      // Parser le message JSON entrant
      const parsedMessage = JSON.parse(message.toString());
      
      // Vérifier si c'est un message de chat
      if (parsedMessage.type === 'chat_message') {
        console.log('Broadcasting chat message from:', parsedMessage.message?.username);
        
        // Re-diffuser le message de chat à tous les clients connectés
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(parsedMessage));
          }
        });
      } else {
        // Gérer d'autres types de messages si nécessaire
        console.log('Received non-chat message type:', parsedMessage.type);
      }
    } catch (error) {
      // Le message n'est pas un JSON valide, l'ignorer ou le logger
      console.warn('Received invalid JSON message:', error.message);
    }
  });

  ws.on('close', () => {
    activeUsers--;
    console.log('Client disconnected. Total active users:', activeUsers);
    // Diffuser le nouveau nombre d'utilisateurs à tous les clients restants
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'user_count', count: activeUsers }));
      }
    });
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});