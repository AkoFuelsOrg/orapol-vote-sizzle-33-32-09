
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Send, Bot } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const OPENROUTER_TOKEN = "balirunoxxx";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_TOKEN}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <div className="p-4 border-b bg-primary/5">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Tuwaye AI Gen 0
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              className="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
