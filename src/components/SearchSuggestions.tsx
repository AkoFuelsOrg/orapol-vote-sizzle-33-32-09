
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageCircle, Search, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { getSearchHistory, addToSearchHistory, SearchHistoryItem, clearSearchHistory } from '@/lib/search-history';
import { Button } from '@/components/ui/button';

interface SearchSuggestion {
  id: string;
  type: 'user' | 'poll';
  text: string;
  avatar_url?: string;
  username?: string;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (query: string) => void;
  onClose: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSelect,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load search history when component mounts
  useEffect(() => {
    const loadSearchHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await getSearchHistory();
        setSearchHistory(history);
      } catch (error) {
        console.error('Error loading search history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    
    loadSearchHistory();
  }, []);
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      
      try {
        // Fetch users matching the query
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${debouncedQuery}%`)
          .limit(3);
        
        // Fetch polls matching the query
        const { data: polls } = await supabase
          .from('polls')
          .select('id, question')
          .ilike('question', `%${debouncedQuery}%`)
          .limit(3);
        
        const userSuggestions = users?.map(user => ({
          id: user.id,
          type: 'user' as const,
          text: user.username || 'User',
          avatar_url: user.avatar_url,
          username: user.username
        })) || [];
        
        const pollSuggestions = polls?.map(poll => ({
          id: poll.id,
          type: 'poll' as const,
          text: poll.question
        })) || [];
        
        setSuggestions([...userSuggestions, ...pollSuggestions]);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'user') {
      navigate(`/user/${suggestion.id}`);
    } else {
      navigate(`/poll/${suggestion.id}`);
    }
    onClose();
  };

  const handleHistoryItemClick = (query: string) => {
    onSelect(query);
  };

  const handleSearchClick = async () => {
    if (debouncedQuery.trim()) {
      try {
        // Update both database and local state
        const updatedHistory = await addToSearchHistory(debouncedQuery.trim());
        setSearchHistory(updatedHistory);
        navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
        onClose();
      } catch (error) {
        console.error('Error saving search history:', error);
        // Still navigate even if saving history fails
        navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
        onClose();
      }
    }
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clearSearchHistory();
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  // Always show history when it exists
  const showHistory = searchHistory.length > 0;
  const showSuggestions = debouncedQuery.length >= 2 && suggestions.length > 0;
  const showNoResults = debouncedQuery.length >= 2 && suggestions.length === 0 && !loading;
  
  // Return null only if there's nothing to display
  if (!showHistory && !showSuggestions && !showNoResults && !loading && !historyLoading) {
    return null;
  }
  
  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50"
    >
      {(loading || historyLoading) ? (
        <div className="p-2 text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="max-h-60 overflow-y-auto py-1">
          {/* Search history section - now always shown when history exists */}
          {showHistory && (
            <div className="mb-1">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">Recent Searches</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 py-1 text-xs hover:bg-gray-100"
                  onClick={handleClearHistory}
                >
                  Clear
                </Button>
              </div>
              {searchHistory.map((item, i) => (
                <div
                  key={`history-${item.id || i}`}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => handleHistoryItemClick(item.query)}
                >
                  <div className="bg-gray-100 p-1 rounded-full">
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-sm truncate">
                    {item.query}
                  </div>
                </div>
              ))}
              {showSuggestions && <div className="border-t border-gray-100 mt-1"></div>}
            </div>
          )}
          
          {/* Search suggestions section */}
          {showSuggestions && suggestions.map((suggestion) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === 'user' ? (
                <Avatar className="h-6 w-6">
                  {suggestion.avatar_url ? (
                    <AvatarImage src={suggestion.avatar_url} alt={suggestion.username || "User"} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {suggestion.username ? suggestion.username[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="bg-primary/10 p-1 rounded-full">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="text-sm truncate">
                {suggestion.text}
              </div>
            </div>
          ))}
          
          {showNoResults && (
            <div className="p-2 text-sm text-gray-500">No results found</div>
          )}
          
          {debouncedQuery.trim().length > 0 && (
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 border-t border-gray-100"
              onClick={handleSearchClick}
            >
              <Search className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-primary">
                Search for "{debouncedQuery}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
