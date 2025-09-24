import { AppState, Gamification, PracticeLot } from '../types';

const STORAGE_PREFIX = 'demoApp:';

// Get item from localStorage with fallback
const getStorageItem = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

// Set item in localStorage
const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

// Load gamification data
export const loadGamification = (): Gamification => {
  return getStorageItem('gamification', {
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
    lastCheckInDate: undefined
  });
};

// Save gamification data
export const saveGamification = (gamification: Gamification): void => {
  setStorageItem('gamification', gamification);
};

// Load completed tasks
export const loadCompletedTasks = (): string[] => {
  return getStorageItem('completedTasks', []);
};

// Save completed tasks
export const saveCompletedTasks = (completedTasks: string[]): void => {
  setStorageItem('completedTasks', completedTasks);
};

// Load watchlist
export const loadWatchlist = (): string[] => {
  return getStorageItem('watchlist', []);
};

// Save watchlist
export const saveWatchlist = (watchlist: string[]): void => {
  setStorageItem('watchlist', watchlist);
};

// Load practice lots
export const loadPracticeLots = (): PracticeLot[] => {
  return getStorageItem('practiceLots', []);
};

// Save practice lots
export const savePracticeLots = (practiceLots: PracticeLot[]): void => {
  setStorageItem('practiceLots', practiceLots);
};

// Load theme preference
export const loadThemePreference = (): 'light' | 'dark' => {
  return getStorageItem('theme', 'light');
};

// Save theme preference
export const saveThemePreference = (theme: 'light' | 'dark'): void => {
  setStorageItem('theme', theme);
};

// Clear all data (for testing/reset)
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

// Load all app state
export const loadAppState = (initialData: AppState): AppState => {
  const gamification = loadGamification();
  const completedTasks = loadCompletedTasks();
  const watchlistTickers = loadWatchlist();
  const practiceLots = loadPracticeLots();
  
  // Filter watchlist items based on saved tickers
  const watchlist = initialData.watchlist.filter(item => 
    watchlistTickers.includes(item.ticker)
  );
  
  return {
    ...initialData,
    gamification,
    completedTasks,
    watchlist,
    practiceLots
  };
};

// Save all app state
export const saveAppState = (state: AppState): void => {
  saveGamification(state.gamification);
  saveCompletedTasks(state.completedTasks);
  saveWatchlist(state.watchlist.map(item => item.ticker));
  savePracticeLots(state.practiceLots);
};
