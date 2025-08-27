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
    // Gérer les messages entrants (par exemple, messages de chat)
    // Diffuser le message à tous les clients connectés
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
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