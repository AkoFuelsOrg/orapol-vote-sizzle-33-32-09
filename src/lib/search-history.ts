
/**
 * Utility functions for managing search history
 */

const SEARCH_HISTORY_KEY = 'tuwaye-search-history';
const MAX_HISTORY_ITEMS = 5;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * Get the current search history from localStorage
 */
export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

/**
 * Add a search query to history and limit to MAX_HISTORY_ITEMS
 */
export const addToSearchHistory = (query: string): void => {
  if (!query.trim()) return;
  
  try {
    const history = getSearchHistory();
    
    // Remove any existing instances of this query
    const filteredHistory = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    
    // Add new query to the beginning
    const updatedHistory = [
      { query, timestamp: Date.now() },
      ...filteredHistory
    ].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

/**
 * Clear all search history
 */
export const clearSearchHistory = (): void => {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
};
