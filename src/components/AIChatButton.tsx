
import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from './ui/button';
import { AIChatModal } from './AIChatModal';
import { useLocation } from 'react-router-dom';

const AIChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Check if on index page (root path)
  const isIndexPage = location.pathname === '/';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary transition-all rounded-lg p-2 w-full"
        style={{ display: isIndexPage ? 'none' : 'block' }}
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
