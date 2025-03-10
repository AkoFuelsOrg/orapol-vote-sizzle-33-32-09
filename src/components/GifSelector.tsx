
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Updated GIFs with working URLs
const sampleGifs = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWxqM2JkenFnbTRrZzI5ZGc5b2RkczFrbHJucG9zMHJxaTl1N2NvYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kHmVOy84g8G6my09fu/giphy.gif', // dancing
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGkycGF2ZHRiMHI3MDhvcjU3azd1dHJvazFteTNqbzVmYzA3cHV0ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8m4R4pvViWtRzbloJ1/giphy.gif', // thumbs up
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazR1dmY3a3p4YmttZmlvemM3OHNudnZrbTVsZ3p1cWM3cjc4ZGw3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2sXf9PbHcEdE1x059I/giphy.gif', // laughing 
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOG12MGkycjF0eGkzdWZ3aDhwZm5jMnhoOHJwc2l4YjI5anFveGxwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0D4Wb1OZRoU1fa/giphy.gif', // sad
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjlqZnB1amdoaG1wbHdvcGF2NDVtbXJpM2FnYTFqYmJsZ2c0dHdycyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TL4d81cXH4THa/giphy.gif', // crying
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHI0NTBnc3lvZDZtY2VydDNydnQ1ZncwNHcwM3R0amExenh5cm9vciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QMkPpxPDYY0fu/giphy.gif', // thinking
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjVtZHE0d3ZvYzN5ZWJwM2JmaGQ1NmcwNjR6MGpsMGZneG5lZmZ3ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LmNwrBhejkK9EFP504/giphy.gif', // wow
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajFtbHQzMmRvbWVmaWE5enQzNnUzeTN6czV3MmlhajluaWxqYWJrdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPsx2VAYAgEHC12/giphy.gif'  // funny
];

// Updated search terms with more accurate mapping
const gifSearchMap: Record<string, string[]> = {
  'happy': [sampleGifs[0], sampleGifs[1], sampleGifs[2]],
  'sad': [sampleGifs[3], sampleGifs[4]],
  'think': [sampleGifs[5]],
  'wow': [sampleGifs[6]],
  'funny': [sampleGifs[2], sampleGifs[7]],
  'laugh': [sampleGifs[2]],
  'dance': [sampleGifs[0]],
  'cry': [sampleGifs[4]],
  'thumbs': [sampleGifs[1]],
  'yes': [sampleGifs[1]],
  'no': [sampleGifs[3], sampleGifs[4]],
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
      
      // Search for any keyword that contains the query
      Object.keys(gifSearchMap).forEach(term => {
        if (term.includes(lowerCaseQuery)) {
          results.push(...gifSearchMap[term]);
        }
      });
      
      // If no results found, return a subset of samples as fallback
      const uniqueResults = [...new Set(results)];
      setGifs(uniqueResults.length > 0 ? uniqueResults : sampleGifs.slice(0, 3));
    }, 300); // Reduced timeout for better UX
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
