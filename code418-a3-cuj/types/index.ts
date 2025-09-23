export type Category = "US Equity ETF" | "Canada Equity ETF" | "Bond ETF" | "US Tech Equity" | "Global Equity ETF";

export type Position = {
  ticker: string;
  name: string;
  qty: number;
  avgCost: number;
  lastPrice: number;
  prevClose: number;
  category: Category;
};

export type WatchlistItem = {
  ticker: string;
  name: string;
  lastPrice: number;
  prevClose: number;
  category: Category;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  tickers: string[];
  url: string;
  tldr: string;
};

export type TaskType = "lesson" | "news_skim" | "simulate" | "review_holdings";

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  estMins: number;
  params?: {
    ticker?: string;
    amount?: number;
  };
};

export type PracticeLot = {
  ticker: string;
  shares: number;
  price: number;
  date: string;
};

export type User = {
  userId: string;
  name: string;
  riskTolerance: string;
  goalHorizonYears: number;
};

export type Gamification = {
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  lastCheckInDate?: string;
};

export type AppState = {
  user: User;
  positions: Position[];
  watchlist: WatchlistItem[];
  news: NewsItem[];
  tasks: Task[];
  gamification: Gamification;
  completedTasks: string[];
  practiceLots: PracticeLot[];
};
