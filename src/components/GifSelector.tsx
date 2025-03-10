
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Sample GIFs - in a real app, these would come from an API like GIPHY or Tenor
const sampleGifs = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGRmcGpvemZjbnEwaXk0bzNlZGY1bzd2ZXZ3dWU1Y2Y1enZ1bG45eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5xtDarIHieSQaA1HmBW/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2prNGF1ZjRueDZhd2hnajhzMGJmdnVnempveWJpb2lxM3RsM2ZyMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMVGGPNJBl9EK4/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2NxdHd0Nmw2Z2Y3czRnMmhiM3Nxd2kxa3phZmJxOW04bDRndnRwdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pPVvKdtlkOIHjJWcfb/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDZ3eThtNmR6OGhmeG0wbTYweGRpbzI4eHU5a2l6anVrdHM0MXhoaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CcgO6hjOoNrfa/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzlnYXNzajZ6b2kycWdycmtjaTFibnZyYzM0dmNmeWVmaWNoc3VyYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/U1n0R4nQUYZ3i/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2d0cHk2djBnM3lpNXJyaWtpNHVuc241Z3loMGxmZm01NzQyaGRnOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wRzkZH82AqfzzGr1ES/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW1paTdzYmI1b3dkbDAzZ3UwaHdoY3prOHFiZW80eDNzOWYyZTI2cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SSGgQV6gckxgIrVgQT/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWc3ZnM2a24xZWY0YjJ2emR0dWhxZndjOHlweHd2cWZiYjhndTNvZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fCCyMb3O7qZKU/giphy.gif'
];

// Search terms to filter GIFs (for demo purposes)
const gifSearchMap: Record<string, string[]> = {
  'happy': [sampleGifs[0], sampleGifs[1], sampleGifs[2]],
  'sad': [sampleGifs[3], sampleGifs[4]],
  'react': [sampleGifs[5], sampleGifs[6]],
  'funny': [sampleGifs[1], sampleGifs[2], sampleGifs[7]],
  'cat': [sampleGifs[2], sampleGifs[5]],
  'dog': [sampleGifs[0], sampleGifs[3]],
};

interface GifSelectorProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const GifSelector: React.FC<GifSelectorProps> = ({ onSelectGif, onClose, isVisible }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [gifs, setGifs] = useState(sampleGifs);

  // Reset gifs when visibility changes
  useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      setGifs(sampleGifs);
    }
  }, [isVisible]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple search functionality using the predefined map
    setTimeout(() => {
      setLoading(false);
      
      if (!searchQuery.trim()) {
        setGifs(sampleGifs);
        return;
      }
      
      const lowerCaseQuery = searchQuery.toLowerCase();
      const results: string[] = [];
      
      Object.keys(gifSearchMap).forEach(term => {
        if (term.includes(lowerCaseQuery)) {
          results.push(...gifSearchMap[term]);
        }
      });
      
      // Remove duplicates
      const uniqueResults = [...new Set(results)];
      setGifs(uniqueResults.length > 0 ? uniqueResults : sampleGifs.slice(0, 2));
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="p-2 bg-background border rounded-lg shadow-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Select GIF</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="button" size="sm" disabled={loading} onClick={handleSearch}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px]">
        {gifs.map((gif, index) => (
          <div 
            key={index} 
            onClick={() => onSelectGif(gif)}
            className="cursor-pointer hover:opacity-80 transition-opacity bg-muted/20 rounded overflow-hidden aspect-video flex items-center justify-center"
          >
            <img src={gif} alt="GIF" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GifSelector;
