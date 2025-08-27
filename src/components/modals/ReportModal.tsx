import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { ChatMessage, Report } from '../../types';

interface ReportModalProps {
  message: ChatMessage;
  reporterUsername: string;
  onSubmit: (report: Report) => void;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  message,
  reporterUsername,
  onSubmit,
  onClose
}) => {
  const [reportReason, setReportReason] = useState('');

  const handleSubmit = () => {
    if (reportReason.trim()) {
      const report: Report = {
        id: Date.now().toString(),
        messageId: message.id,
        reportedUser: message.username,
        reportedMessage: message.message,
        reportReason: reportReason.trim(),
        reporterUsername,
        timestamp: new Date(),
        status: 'pending'
      };

      onSubmit(report);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
      <div className="glass-dark border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Flag className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Signaler un Message</h3>
            <p className="text-slate-400">Pourquoi signalez-vous ce message ?</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6">
          <p className="text-sm text-slate-400 mb-2">Message signalé :</p>
          <p className="font-medium text-white">"{message.message}"</p>
          <p className="text-xs text-slate-500 mt-2">Par {message.username}</p>
        </div>

        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Décrivez la raison du signalement..."
          className="w-full h-32 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 mb-6 resize-none transition-all"
          maxLength={500}
        />
        
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reportReason.trim()}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
          >
            Signaler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;