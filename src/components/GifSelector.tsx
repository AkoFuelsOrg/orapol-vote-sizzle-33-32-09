
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

interface GifSelectorProps {
  onGifSelected: (url: string) => void;
}

const GifSelector: React.FC<GifSelectorProps> = ({ onGifSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Example GIFs - in a real app, you'd fetch these from a service like Giphy or Tenor
  const exampleGifs = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWNxbTF1cnd3d2N5Z29reWs4OWJydW5jaXh3MWhkY2tmbzB4aHFoYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzUzcGw1b2s0Y28xa2c5NmxmZXRkcDJoN2I3a21sdWJ0MHVkYWxsdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4HodBpDmoMA5p9bG/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXB6a3hzcWNlNGZoYWtrZ3g3eTVwdDUwa2FtOWdlejltOXI1YWZvbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEdv4hwWTzBhWvaU0/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjMzZGV2eXV3cDQ5cXlvNXV5YXk1bWN3aHg2bnkwMTQyZTRrbXU5bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26FPqAHtgCBzKG9mo/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3o1dG0zZHdsZXoxbGEybXlybnAyc2dseTlvcnVzMzRjcWExaGtuaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lXkx9x8OTusVb2/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJrbGFoNmNlYTd5eXhhc3d6dGpmN2ZobjV3YmFkZnZtcGVnZTFraSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l46CDHTqbmnGZyxKo/giphy.gif"
  ];
  
  const handleGifClick = (url: string) => {
    onGifSelected(url);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image size={18} />
        <span>GIF</span>
      </Button>
      
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 bg-background border rounded-lg shadow-lg p-2 z-10 w-[300px]">
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {exampleGifs.map((url, index) => (
              <button 
                key={index} 
                className="rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleGifClick(url)}
              >
                <img src={url} alt={`GIF ${index + 1}`} className="w-full h-auto object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GifSelector;
