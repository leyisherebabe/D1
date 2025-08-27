import React from 'react';
import { EMOJIS } from '../../utils/constants';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  return (
    <div className="absolute bottom-12 right-0 glass-dark border border-slate-600 rounded-xl p-3 shadow-2xl z-20 animate-in zoom-in-95 duration-200">
      <div className="grid grid-cols-5 gap-2">
        {EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="w-8 h-8 hover:bg-slate-700 rounded-lg transition-all text-lg transform hover:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;