import React from 'react';
import { Trash2, VolumeX, Ban, Flag } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types';
import { formatTime, getRoleIcon } from '../../utils/helpers';

interface ChatMessageProps {
  message: ChatMessageType;
  currentUsername: string;
  userRole: 'viewer' | 'moderator' | 'admin';
  onDeleteMessage: (messageId: string) => void;
  onMuteUser: (username: string) => void;
  onBanUser: (username: string) => void;
  onReportMessage: (message: ChatMessageType) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUsername,
  userRole,
  onDeleteMessage,
  onMuteUser,
  onBanUser,
  onReportMessage
}) => {
  const isOwnMessage = message.username === currentUsername;
  const canModerate = (userRole === 'moderator' || userRole === 'admin') && !message.isSystem && !isOwnMessage;

  return (
    <div 
      className={`p-4 rounded-xl transition-all hover:bg-slate-800/30 group border ${
        isOwnMessage ? 'bg-indigo-500/10 border-indigo-500/30' : 
        message.isSystem ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/20 border-slate-700/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span 
            className="font-medium text-sm"
            style={{ color: message.color || '#64748b' }}
          >
            {getRoleIcon(message.role)} {message.username}
          </span>
          {message.role === 'moderator' && (
            <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/30">
              MOD
            </span>
          )}
          {message.role === 'admin' && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/30">
              ADMIN
            </span>
          )}
          {message.ip && (userRole === 'admin' || userRole === 'moderator') && (
            <span className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded">
              {message.ip}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
          {canModerate && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
              <button
                onClick={() => onDeleteMessage(message.id)}
                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all transform hover:scale-110"
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onMuteUser(message.username)}
                className="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg hover:bg-orange-500/10 transition-all transform hover:scale-110"
                title="Mute"
              >
                <VolumeX className="h-3 w-3" />
              </button>
              <button
                onClick={() => onBanUser(message.username)}
                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all transform hover:scale-110"
                title="Bannir"
              >
                <Ban className="h-3 w-3" />
              </button>
            </div>
          )}
          {!message.isSystem && !isOwnMessage && (
            <button
              onClick={() => onReportMessage(message)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all transform hover:scale-110"
              title="Signaler"
            >
              <Flag className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-200 break-words leading-relaxed">
        {message.message}
      </p>
    </div>
  );
};

export default ChatMessage;