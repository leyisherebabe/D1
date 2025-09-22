import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { PopupAnnouncement as PopupAnnouncementType } from '../../types';

interface PopupAnnouncementProps {
  announcement: PopupAnnouncementType;
  onClose: () => void;
}

const PopupAnnouncement: React.FC<PopupAnnouncementProps> = ({
  announcement,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
      <div className="glass-dark border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">{announcement.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {announcement.image && (
          <img
            src={announcement.image}
            alt={announcement.title}
            className="w-full h-40 object-cover rounded-xl mb-6 border border-slate-700"
          />
        )}
        
        <p className="text-slate-300 mb-8 leading-relaxed">{announcement.description}</p>
        
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105"
        >
          Compris !
        </button>
      </div>
    </div>
  );
};

export default PopupAnnouncement;