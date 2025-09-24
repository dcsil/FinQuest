import { Position, PracticeLot, Gamification } from '../types';

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Percentage formatting
export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

// Calculate position value
export const calculatePositionValue = (position: Position): number => {
  return position.qty * position.lastPrice;
};

// Calculate day change (absolute)
export const calculateDayChangeAbs = (position: Position): number => {
  return position.qty * (position.lastPrice - position.prevClose);
};

// Calculate day change (percentage)
export const calculateDayChangePct = (position: Position): number => {
  return ((position.lastPrice - position.prevClose) / position.prevClose) * 100;
};

// Calculate total P/L
export const calculateTotalPL = (position: Position): number => {
  return (position.lastPrice - position.avgCost) * position.qty;
};

// Calculate portfolio totals
export const calculatePortfolioTotals = (positions: Position[], practiceLots: PracticeLot[] = []) => {
  let totalValue = 0;
  let totalDayChange = 0;
  let totalPL = 0;

  positions.forEach(position => {
    const value = calculatePositionValue(position);
    const dayChange = calculateDayChangeAbs(position);
    const pl = calculateTotalPL(position);
    
    totalValue += value;
    totalDayChange += dayChange;
    totalPL += pl;
  });

  // Add practice lots
  practiceLots.forEach(lot => {
    const matchingPosition = positions.find(p => p.ticker === lot.ticker);
    if (matchingPosition) {
      const lotValue = lot.shares * matchingPosition.lastPrice;
      const lotDayChange = lot.shares * (matchingPosition.lastPrice - matchingPosition.prevClose);
      const lotPL = lot.shares * (matchingPosition.lastPrice - lot.price);
      
      totalValue += lotValue;
      totalDayChange += lotDayChange;
      totalPL += lotPL;
    }
  });

  return {
    totalValue,
    totalDayChange,
    totalPL,
    totalDayChangePct: totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0
  };
};

// Calculate allocation by category
export const calculateAllocation = (positions: Position[], practiceLots: PracticeLot[] = []) => {
  const categoryTotals: { [key: string]: number } = {};
  const totalValue = calculatePortfolioTotals(positions, practiceLots).totalValue;

  // Add regular positions
  positions.forEach(position => {
    const value = calculatePositionValue(position);
    categoryTotals[position.category] = (categoryTotals[position.category] || 0) + value;
  });

  // Add practice lots
  practiceLots.forEach(lot => {
    const matchingPosition = positions.find(p => p.ticker === lot.ticker);
    if (matchingPosition) {
      const lotValue = lot.shares * matchingPosition.lastPrice;
      categoryTotals[matchingPosition.category] = (categoryTotals[matchingPosition.category] || 0) + lotValue;
    }
  });

  return Object.entries(categoryTotals).map(([category, value]) => ({
    category,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
  }));
};

// XP and level calculations
export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

export const calculateXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  const nextLevelXP = currentLevel * 100;
  return nextLevelXP - currentXP;
};

export const getXPProgress = (currentXP: number): { current: number; needed: number; progress: number } => {
  const currentLevel = calculateLevel(currentXP);
  const levelStartXP = (currentLevel - 1) * 100;
  const levelEndXP = currentLevel * 100;
  const progressInLevel = currentXP - levelStartXP;
  const progressNeeded = levelEndXP - levelStartXP;
  
  return {
    current: progressInLevel,
    needed: progressNeeded,
    progress: (progressInLevel / progressNeeded) * 100
  };
};

// XP rewards by task type
export const getXPReward = (taskType: string): number => {
  switch (taskType) {
    case 'lesson': return 20;
    case 'news_skim': return 10;
    case 'simulate': return 30;
    case 'review_holdings': return 10;
    default: return 0;
  }
};

// Streak management
export const shouldIncrementStreak = (lastCheckInDate?: string): boolean => {
  if (!lastCheckInDate) return true;
  
  const lastCheck = new Date(lastCheckInDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare dates only
  lastCheck.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  return lastCheck < yesterday;
};

export const updateStreak = (gamification: Gamification): Gamification => {
  const today = new Date().toISOString().split('T')[0];
  
  if (shouldIncrementStreak(gamification.lastCheckInDate)) {
    return {
      ...gamification,
      streak: gamification.streak + 1,
      lastCheckInDate: today
    };
  }
  
  return {
    ...gamification,
    lastCheckInDate: today
  };
};

// Badge checking
export const checkForNewBadges = (gamification: Gamification): string[] => {
  const newBadges: string[] = [];
  const existingBadges = gamification.badges;
  
  if (gamification.streak >= 1 && !existingBadges.includes('day1')) {
    newBadges.push('day1');
  }
  if (gamification.streak >= 3 && !existingBadges.includes('streak3')) {
    newBadges.push('streak3');
  }
  if (gamification.streak >= 7 && !existingBadges.includes('streak7')) {
    newBadges.push('streak7');
  }
  
  return newBadges;
};

// Time formatting
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  return `${diffInDays}d ago`;
};
