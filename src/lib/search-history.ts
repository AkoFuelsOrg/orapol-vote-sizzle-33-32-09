const SEARCH_HISTORY_KEY = 'tuwaye-search-history';
const MAX_HISTORY_SIZE = 20;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export const getSearchHistory = (): SearchHistoryItem[] => {
  const historyString = localStorage.getItem(SEARCH_HISTORY_KEY);
  if (!historyString) {
    return [];
  }
  try {
    return JSON.parse(historyString);
  } catch (error) {
    console.error('Error parsing search history:', error);
    return [];
  }
};

export const addToSearchHistory = async (query: string): Promise<void> => {
  const history = getSearchHistory();
  
  // Check if query already exists (case insensitive)
  const existingIndex = history.findIndex(
    item => item.query.toLowerCase() === query.toLowerCase()
  );
  
  let updatedHistory = [...history];
  
  if (existingIndex !== -1) {
    // Remove existing entry
    updatedHistory.splice(existingIndex, 1);
  }
  
  // Add new entry at the beginning
  updatedHistory.unshift({
    id: Date.now().toString(),
    query,
    timestamp: Date.now()
  });
  
  // Remove oldest items if history exceeds max size
  if (updatedHistory.length > MAX_HISTORY_SIZE) {
    updatedHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE);
  }

  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const removeFromSearchHistory = async (id: string): Promise<void> => {
  const history = getSearchHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const clearSearchHistory = async (): Promise<void> => {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([]));
};

export const getFuzzySearchSuggestions = (query: string, history: SearchHistoryItem[]): SearchHistoryItem[] => {
  if (!query.trim()) {
    return history.slice(0, 5); // Return most recent 5 if no query
  }
  
  const lowerQuery = query.toLowerCase();
  const results = history
    .filter(item => {
      if (item) {
        return item.query.toLowerCase().includes(lowerQuery);
      }
      return false;
    })
    .slice(0, 5);
  
  return results;
};

export const printOldestQueryIfMatches = (queryToMatch: string): void => {
  const history = getSearchHistory();
  if (history.length === 0) {
    console.log("Search history is empty.");
    return;
  }

  const item = history.find(h => h.query === queryToMatch);

  if (item) {
    console.log(item.query);
  } else {
    console.log("No matching item found or item is null/undefined.");
  }
};
