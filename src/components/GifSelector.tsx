
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Define props interface
export interface GifSelectorProps {
  onSelectGif: (gifUrl: string) => Promise<void>;
  onClose: () => void;
  isVisible: boolean;
}

const GifSelector: React.FC<GifSelectorProps> = ({ onSelectGif, onClose, isVisible }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = 'hYSSOPVwgcRkYOkBpuXGfMMXkEQT7JJZ'; // Giphy API key
  
  useEffect(() => {
    if (isVisible) {
      fetchTrendingGifs();
    }
  }, [isVisible]);

  const fetchTrendingGifs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=20&rating=g`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending GIFs');
      }
      
      const data = await response.json();
      setGifs(data.data);
    } catch (err) {
      setError('Error loading GIFs. Please try again.');
      console.error('Error fetching trending GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      fetchTrendingGifs();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
          searchTerm
        )}&limit=20&rating=g`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search GIFs');
      }
      
      const data = await response.json();
      setGifs(data.data);
    } catch (err) {
      setError('Error searching GIFs. Please try again.');
      console.error('Error searching GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="p-3 bg-background border rounded-lg shadow-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Select a GIF</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={searchGifs} className="flex gap-2 mb-3">
        <Input
          type="text"
          placeholder="Search GIFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
      
      {loading ? (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pb-1">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              className="overflow-hidden rounded border hover:border-primary transition-colors"
              onClick={() => onSelectGif(gif.images.fixed_height.url)}
            >
              <img 
                src={gif.images.fixed_height_small.url} 
                alt={gif.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </button>
          ))}
          
          {gifs.length === 0 && !loading && (
            <div className="col-span-3 text-center p-6 text-muted-foreground">
              No GIFs found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GifSelector;
