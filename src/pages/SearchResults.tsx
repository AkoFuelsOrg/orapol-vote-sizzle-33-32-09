
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Fuse from 'fuse.js';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<{users: any[], polls: any[]}>({users: [], polls: []});
  const [isLoading, setIsLoading] = useState(true);
  
  // Get search query from URL
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      
      if (!query || query.length < 2) {
        setSearchResults({users: [], polls: []});
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch data for search
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .limit(50);
        
        if (usersError) throw usersError;
        
        const { data: polls, error: pollsError } = await supabase
          .from('polls')
          .select('id, question, created_at, user_id, profiles(username, avatar_url)')
          .limit(50);
        
        if (pollsError) throw pollsError;
        
        // Configure Fuse options for fuzzy search with min matching threshold of 0.4 (60% match)
        const userFuseOptions = {
          keys: ['username'],
          threshold: 0.4,
          includeScore: true
        };
        
        const pollFuseOptions = {
          keys: ['question'],
          threshold: 0.4,
          includeScore: true
        };
        
        const userFuse = new Fuse(users || [], userFuseOptions);
        const pollFuse = new Fuse(polls || [], pollFuseOptions);
        
        const userResults = userFuse.search(query).map(result => result.item);
        const pollResults = pollFuse.search(query).map(result => result.item);
        
        setSearchResults({
          users: userResults,
          polls: pollResults
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [query]);
  
  const navigateToUser = (userId: string) => {
    navigate(`/user/${userId}`);
  };
  
  const navigateToPoll = (pollId: string) => {
    navigate(`/poll/${pollId}`);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-8">
        <Search className="h-5 w-5 text-red-500" />
        <h1 className="text-2xl font-bold">Search Results for "{query}"</h1>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {searchResults.users.length === 0 && searchResults.polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">No results found for "{query}"</p>
              <p className="text-gray-400 mt-2">Try another search term</p>
            </div>
          ) : (
            <div className="space-y-8">
              {searchResults.users.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Users ({searchResults.users.length})</h2>
                  <div className="space-y-3">
                    {searchResults.users.map((user) => (
                      <Card key={user.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigateToUser(user.id)}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url} alt={user.username || "User"} />
                            ) : null}
                            <AvatarFallback className="bg-red-100 text-red-500">
                              {user.username ? user.username[0].toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.polls.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Polls ({searchResults.polls.length})</h2>
                  <div className="space-y-3">
                    {searchResults.polls.map((poll) => (
                      <Card 
                        key={poll.id} 
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToPoll(poll.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-3 rounded-full">
                            <MessageCircle className="h-6 w-6 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{poll.question}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(poll.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
