
/**
 * Utility functions for managing search history in Supabase
 */

import { supabase } from '@/integrations/supabase/client';
const MAX_HISTORY_ITEMS = 5;

export interface SearchHistoryItem {
  id?: string;
  user_id?: string;
  query: string;
  timestamp: number;
}

/**
 * Get the current search history from Supabase
 */
export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch search history for this user
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(MAX_HISTORY_ITEMS);

    if (error) {
      console.error('Failed to fetch search history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

/**
 * Add a search query to history and limit to MAX_HISTORY_ITEMS
 */
export const addToSearchHistory = async (query: string): Promise<SearchHistoryItem[]> => {
  if (!query.trim()) return await getSearchHistory();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Check if this query already exists for this user
    const { data: existingQuery } = await supabase
      .from('search_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('query', query.toLowerCase())
      .maybeSingle();
    
    // If it exists, delete it so we can add it again with updated timestamp
    if (existingQuery?.id) {
      await supabase
        .from('search_history')
        .delete()
        .eq('id', existingQuery.id);
    }
    
    // Insert new search record
    const newSearch = {
      user_id: user.id,
      query: query.trim(),
      timestamp: Date.now()
    };
    
    await supabase.from('search_history').insert(newSearch);
    
    // After inserting the new search, check if we have more than MAX_HISTORY_ITEMS
    // If so, delete the oldest ones
    const { data: allSearches } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
      
    if (allSearches && allSearches.length > MAX_HISTORY_ITEMS) {
      const itemsToDelete = allSearches.slice(MAX_HISTORY_ITEMS);
      const idsToDelete = itemsToDelete.map(item => item.id);
      
      await supabase
        .from('search_history')
        .delete()
        .in('id', idsToDelete);
    }
    
    // Return updated search history
    return await getSearchHistory();
  } catch (error) {
    console.error('Failed to save search history:', error);
    return await getSearchHistory();
  }
};

/**
 * Clear all search history
 */
export const clearSearchHistory = async (): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Delete all search history for this user
    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};
