import { AppState } from '../types';

export const mockData: AppState = {
  user: {
    userId: "demo-user",
    name: "Jason",
    riskTolerance: "Medium",
    goalHorizonYears: 5
  },
  positions: [
    {
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      qty: 12,
      avgCost: 410.50,
      lastPrice: 422.30,
      prevClose: 418.00,
      category: "US Equity ETF"
    },
    {
      ticker: "XIC.TO",
      name: "iShares Core S&P/TSX Capped Composite",
      qty: 30,
      avgCost: 33.20,
      lastPrice: 34.10,
      prevClose: 33.85,
      category: "Canada Equity ETF"
    },
    {
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      qty: 20,
      avgCost: 72.10,
      lastPrice: 71.80,
      prevClose: 72.00,
      category: "Bond ETF"
    },
    {
      ticker: "AAPL",
      name: "Apple Inc.",
      qty: 5,
      avgCost: 178.00,
      lastPrice: 191.20,
      prevClose: 189.50,
      category: "US Tech Equity"
    }
  ],
  watchlist: [
    {
      ticker: "MSFT",
      name: "Microsoft Corp.",
      lastPrice: 415.50,
      prevClose: 410.80,
      category: "US Tech Equity"
    },
    {
      ticker: "VEQT.TO",
      name: "Vanguard All-Equity ETF",
      lastPrice: 37.20,
      prevClose: 37.00,
      category: "Global Equity ETF"
    }
  ],
  news: [
    {
      id: "n1",
      title: "Apple supplier update signals steady iPhone demand",
      source: "Market Daily",
      publishedAt: "2025-09-21T13:00:00Z",
      tickers: ["AAPL"],
      url: "https://example.com/aapl",
      tldr: "Supplier shipments suggest stable near-term demand; long-term outlook unchanged."
    },
    {
      id: "n2",
      title: "Bond yields ease after inflation print",
      source: "Finance Wire",
      publishedAt: "2025-09-21T09:30:00Z",
      tickers: ["BND"],
      url: "https://example.com/bonds",
      tldr: "Softer inflation cooled yields, nudging bond ETF prices slightly higher."
    },
    {
      id: "n3",
      title: "Canada stocks edge up on energy strength",
      source: "TSX Times",
      publishedAt: "2025-09-20T20:00:00Z",
      tickers: ["XIC.TO"],
      url: "https://example.com/tsx",
      tldr: "Energy names lifted the TSX; broad market gains remained modest."
    },
    {
      id: "n4",
      title: "US equities extend rally on mega-cap strength",
      source: "US Markets",
      publishedAt: "2025-09-20T18:00:00Z",
      tickers: ["VOO", "AAPL"],
      url: "https://example.com/us",
      tldr: "Large caps drove index gains; diversification still recommended."
    },
    {
      id: "n5",
      title: "Tech sector shows resilience amid market volatility",
      source: "Tech Finance",
      publishedAt: "2025-09-20T15:00:00Z",
      tickers: ["AAPL", "MSFT"],
      url: "https://example.com/tech",
      tldr: "Major tech companies maintain steady performance despite broader market concerns."
    },
    {
      id: "n6",
      title: "ETF flows continue to favor low-cost index funds",
      source: "ETF Weekly",
      publishedAt: "2025-09-19T12:00:00Z",
      tickers: ["VOO", "XIC.TO"],
      url: "https://example.com/etf",
      tldr: "Investors increasingly choose passive strategies for long-term wealth building."
    }
  ],
  tasks: [
    {
      id: "t1",
      type: "lesson",
      title: "Read: What is an index fund? (2 min)",
      estMins: 2
    },
    {
      id: "t2",
      type: "news_skim",
      title: "Skim 2 headlines about your holdings",
      estMins: 1
    },
    {
      id: "t3",
      type: "simulate",
      title: "Simulate investing $100 in VOO",
      estMins: 2,
      params: {
        ticker: "VOO",
        amount: 100
      }
    },
    {
      id: "t4",
      type: "review_holdings",
      title: "Open Holdings and scroll to the end",
      estMins: 1
    },
    {
      id: "t5",
      type: "lesson",
      title: "Learn: Understanding bond ETFs (3 min)",
      estMins: 3
    },
    {
      id: "t6",
      type: "simulate",
      title: "Simulate investing $50 in XIC.TO",
      estMins: 2,
      params: {
        ticker: "XIC.TO",
        amount: 50
      }
    },
    {
      id: "t7",
      type: "news_skim",
      title: "Check market news for the week",
      estMins: 2
    }
  ],
  gamification: {
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
    lastCheckInDate: undefined
  },
  completedTasks: [],
  practiceLots: []
};
