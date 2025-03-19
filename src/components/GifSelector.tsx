import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useBreakpoint } from '../hooks/use-mobile';

// Expanded collection of GIFs with reliable URLs
const sampleGifs = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWxqM2JkenFnbTRrZzI5ZGc5b2RkczFrbHJucG9zMHJxaTl1N2NvYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kHmVOy84g8G6my09fu/giphy.gif', // dancing
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGkycGF2ZHRiMHI3MDhvcjU3azd1dHJvazFteTNqbzVmYzA3cHV0ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8m4R4pvViWtRzbloJ1/giphy.gif', // thumbs up
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazR1dmY3a3p4YmttZmlvemM3OHNudnZrbTVsZ3p1cWM3cjc4ZGw3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2sXf9PbHcEdE1x059I/giphy.gif', // laughing 
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOG12MGkycjF0eGkzdWZ3aDhwZm5jMnhoOHJwc2l4YjI5anFveGxwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3V0D4Wb1OZRoU1fa/giphy.gif', // sad
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjlqZnB1amdoaG1wbHdvcGF2NDVtbXJpM2FnYTFqYmJsZ2c0dHdycyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TL4d81cXH4THa/giphy.gif', // crying
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHI0NTBnc3lvZDZtY2VydDNydnQ1ZncwNHcwM3R0amExenh5cm9vciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QMkPpxPDYY0fu/giphy.gif', // thinking
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjVtZHE0d3ZvYzN5ZWJwM2JmaGQ1NmcwNjR6MGpsMGZneG5lZmZ3ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LmNwrBhejkK9EFP504/giphy.gif', // wow
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajFtbHQzMmRvbWVmaWE5enQzNnUzeTN6czV3MmlhajluaWxqYWJrdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPsx2VAYAgEHC12/giphy.gif',  // funny
  // Added more reliable GIFs
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmNhZndxNWNxMjV1aWV6NjNqZTI1bzRsNXduaXFqenN6eTFra3pwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hVYVYZZBgF50k/giphy.gif', // cat
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazlncDUzb3YybGt2d3RoaGI1YWt2MmNtdGhraGI2d3lud3dtd2ttbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13CoXDiaCcCoyk/giphy.gif', // dog
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDd3cWF6aGQ1ZnY1cmI3MnIwZjl3bmhoZWU1eTY5cDRocGgzazkyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGcq5tbwUZGZ3RpS/giphy.gif', // love
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2psMzRvbTQzb2RjejQ2bWZjcHZqenF1b29qaTEydDg3NDB3bmtueiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2dQ3FMaMFccpi/giphy.gif', // cool
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWk2ejQ3aDl6MjBkZjUxOXBjeWtmYzBjdzJia3h5YTRnczRvY2RrMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0ILLVvPp8d64Jd6/giphy.gif', // shocked
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDlqdG1raTdiaGs1cmVhejc3azB6bjM5bGE1dGJkanR1YnpvNXF2ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26FLdmIp6wJr91JAI/giphy.gif', // amazing
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3drODM3eGUxYWM1azdrendjdXc3Zm0zcTJzczh6N2kwYnJycjJxcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jJQC2puVZpTMO4vUs0/giphy.gif', // hello
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXFzaHhvbWw1Z21vNHN2bmFtb3IxcXUxMGw3ZGZ2OTl6dTJhcnlvOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26FPOogenQv5eOZHO/giphy.gif'  // bye
];

// Expanded and improved search keyword mapping
const gifSearchMap: Record<string, string[]> = {
  'happy': [sampleGifs[0], sampleGifs[1], sampleGifs[2], sampleGifs[11]],
  'sad': [sampleGifs[3], sampleGifs[4]],
  'think': [sampleGifs[5]],
  'thinking': [sampleGifs[5]],
  'wow': [sampleGifs[6], sampleGifs[13]],
  'funny': [sampleGifs[2], sampleGifs[7]],
  'laugh': [sampleGifs[2]],
  'lol': [sampleGifs[2], sampleGifs[7]],
  'dance': [sampleGifs[0]],
  'dancing': [sampleGifs[0]],
  'cry': [sampleGifs[4]],
  'crying': [sampleGifs[4]],
  'thumbs': [sampleGifs[1]],
  'thumbsup': [sampleGifs[1]],
  'yes': [sampleGifs[1]],
  'no': [sampleGifs[3], sampleGifs[4]],
  'cat': [sampleGifs[8]],
  'kitty': [sampleGifs[8]],
  'dog': [sampleGifs[9]],
  'puppy': [sampleGifs[9]],
  'love': [sampleGifs[10]],
  'heart': [sampleGifs[10]],
  'cool': [sampleGifs[11]],
  'shocked': [sampleGifs[12]],
  'surprise': [sampleGifs[12], sampleGifs[6]],
  'amazing': [sampleGifs[13]],
  'awesome': [sampleGifs[13]],
  'hello': [sampleGifs[14]],
  'hi': [sampleGifs[14]],
  'bye': [sampleGifs[15]],
  'goodbye': [sampleGifs[15]]
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
  const breakpoint = useBreakpoint();

  // Reset gifs when visibility changes
  useEffect(() => {
    if (isVisible) {
      setSearchQuery('');
      setGifs(sampleGifs);
    }
  }, [isVisible]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission - this prevents page reload
    
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
      
      // More flexible search - check if any keyword contains the query
      Object.keys(gifSearchMap).forEach(term => {
        if (term.includes(lowerCaseQuery)) {
          results.push(...gifSearchMap[term]);
        }
      });
      
      // If no exact matches, try partial matches
      if (results.length === 0) {
        Object.entries(gifSearchMap).forEach(([term, urls]) => {
          if (lowerCaseQuery.includes(term)) {
            results.push(...urls);
          }
        });
      }
      
      // If still no results, provide a few random GIFs as fallback
      const uniqueResults = [...new Set(results)];
      if (uniqueResults.length === 0) {
        // Get 4 random GIFs from the sample collection
        const randomGifs = [...sampleGifs]
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);
        setGifs(randomGifs);
      } else {
        setGifs(uniqueResults);
      }
    }, 300);
  };

  if (!isVisible) return null;

  const isDesktop = breakpoint === "desktop" || breakpoint === "tablet";
  
  return (
    <div className={`p-2 bg-background border rounded-lg shadow-lg w-full ${isDesktop ? 'max-w-xl' : 'max-w-md'}`}>
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
        <Button 
          type="button" 
          size="sm" 
          onClick={handleSearch} 
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-2 overflow-y-auto ${isDesktop ? 'max-h-[400px]' : 'max-h-[300px]'}`}>
        {gifs.length > 0 ? (
          gifs.map((gif, index) => (
            <div 
              key={index} 
              onClick={() => onSelectGif(gif)}
              className="cursor-pointer hover:opacity-80 transition-opacity bg-muted/20 rounded overflow-hidden aspect-video flex items-center justify-center"
            >
              <img 
                src={gif} 
                alt="GIF" 
                className="w-full h-full object-cover" 
                loading="lazy"
                onError={(e) => {
                  // Replace broken GIFs with a fallback
                  const target = e.target as HTMLImageElement;
                  target.src = sampleGifs[Math.floor(Math.random() * 4)];
                }}
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center text-muted-foreground">
            No GIFs found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
};

export default GifSelector;
