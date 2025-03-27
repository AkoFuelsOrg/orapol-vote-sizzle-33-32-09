
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Common emojis - can be expanded
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😶‍🌫️', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍',
  '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘'
];

// Categories for emojis
const emojiCategories = {
  "Smileys & People": ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '👦', '👧', '👨', '👩'],
  "Animals & Nature": ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🌱', '🌲', '🌳', '🌴', '🌵', '🌿'],
  "Food & Drink": ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥐', '🍞', '🥖', '🥨'],
  "Activities": ['⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏉', '🎱', '🎮', '🎲', '🧩', '🎭', '🎨', '🎤'],
  "Travel & Places": ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '✈️', '🚀', '🌍', '🌎', '🌏', '🌋'],
  "Objects": ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💡', '🔦', '🧰', '🔧', '🔨', '🪓'],
  "Symbols": ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💕', '💞', '💝', '🔴', '🟠', '🟡'],
  "Flags": ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸']
};

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const filteredEmojis = searchQuery 
    ? commonEmojis.filter(emoji => emoji.includes(searchQuery))
    : activeCategory 
      ? emojiCategories[activeCategory as keyof typeof emojiCategories] 
      : commonEmojis;

  return (
    <div className="p-2 bg-background border rounded-lg shadow-lg w-full max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Select Emoji</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-2 relative">
        <Input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {!searchQuery && (
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.keys(emojiCategories).map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className="text-xs py-1 h-7"
              onClick={() => setActiveCategory(prev => prev === category ? null : category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-6 gap-1 overflow-y-auto max-h-[200px]">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelectEmoji(emoji)}
            className="text-xl p-1 hover:bg-secondary rounded cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
