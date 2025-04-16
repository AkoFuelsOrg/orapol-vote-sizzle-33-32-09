
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';

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
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  if (debouncedQuery.length < 2 || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50"
    >
      {loading ? (
        <div className="p-2 text-sm text-gray-500">Loading suggestions...</div>
      ) : (
        <div className="max-h-60 overflow-y-auto py-1">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
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
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No results found</div>
          )}
          
          <div
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 border-t border-gray-100"
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(debouncedQuery)}`);
              onClose();
            }}
          >
            <Search className="h-4 w-4 text-primary" />
            <div className="text-sm font-medium text-primary">
              Search for "{debouncedQuery}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
