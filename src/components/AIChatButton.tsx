
import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from './ui/button';
import { AIChatModal } from './AIChatModal';

const AIChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary transition-all rounded-lg p-2 w-full"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">Tuwaye AI Gen 0</span>
      </Button>
      
      <AIChatModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default AIChatButton;
