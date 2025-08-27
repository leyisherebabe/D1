import { ChatMessage } from '../types';

export class WebSocketService {
  public ws: WebSocket | null = null; // Rendre ws public pour y accéder depuis App.tsx
  
  connect() {
    // Construire l'URL WebSocket dynamiquement pour l'environnement webcontainer
    const host = window.location.host;
    const wsUrl = host.includes('webcontainer-api.io') 
      ? `ws://${host.replace('-5173-', '-3000-')}/ws`
      : 'ws://localhost:3000/ws';
    
    this.ws = new WebSocket(wsUrl);
    
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
  
  sendMessage(chatMessage: ChatMessage) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Convertir la date en string pour la sérialisation JSON
        const messageToSend = {
          ...chatMessage,
          timestamp: chatMessage.timestamp instanceof Date ? chatMessage.timestamp.toISOString() : chatMessage.timestamp
        };
        
        console.log('Sending WebSocket message:', messageToSend);
        
        this.ws.send(JSON.stringify({
          type: 'chat_message',
          message: messageToSend
        }));
        
        console.log('WebSocket message sent successfully');
      } else {
        console.warn('WebSocket not open. Message not sent. ReadyState:', this.ws?.readyState);
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      throw error; // Re-throw pour que l'appelant puisse gérer l'erreur
    }
  }
  
  sendUserInfo(username: string, page: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'user_info',
        username: username,
        page: page
      }));
    } else {
      console.warn('WebSocket not open. User info not sent.');
    }
  }
  
  sendAdminAction(action: string, targetUserId?: string, targetUsername?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'admin_action',
        action: action,
        targetUserId: targetUserId,
        targetUsername: targetUsername
      }));
    } else {
      console.warn('WebSocket not open. Admin action not sent.');
    }
  }
}