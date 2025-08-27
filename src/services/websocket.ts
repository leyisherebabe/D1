export class WebSocketService {
  public ws: WebSocket | null = null; // Rendre ws public pour y accéder depuis App.tsx
  
  connect() {
    // REMPLACEZ PAR VOTRE SERVEUR WEBSOCKET
    // Pour le développement local, utilisez ws://localhost:3000/ws
    this.ws = new WebSocket('ws://localhost:3000/ws');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  sendMessage(message: string, username: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        message,
        username,
        timestamp: new Date()
      }));
    } else {
      console.warn('WebSocket not open. Message not sent.');
    }
  }
}