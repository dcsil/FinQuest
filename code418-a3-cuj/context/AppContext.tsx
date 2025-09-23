import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Gamification, PracticeLot, Task } from '../types';
import { mockData } from '../data';
import { loadAppState, saveAppState } from '../utils/localStorage';
import { updateStreak, checkForNewBadges, getXPReward } from '../utils';

type AppAction =
    | { type: 'INIT_APP' }
    | { type: 'COMPLETE_TASK'; taskId: string; taskType: string }
    | { type: 'UNDO_TASK'; taskId: string; taskType: string }
    | { type: 'ADD_PRACTICE_LOT'; practiceLot: PracticeLot }
    | { type: 'ADD_TO_WATCHLIST'; ticker: string; item: any }
    | { type: 'REMOVE_FROM_WATCHLIST'; ticker: string }
    | { type: 'UNLOCK_BADGE'; badge: string };

const initialState: AppState = {
    ...mockData,
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

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'INIT_APP':
            return loadAppState(mockData);

        case 'COMPLETE_TASK': {
            const newCompletedTasks = [...state.completedTasks, action.taskId];
            const xpReward = getXPReward(action.taskType);
            const newXP = state.gamification.xp + xpReward;
            const newLevel = Math.floor(newXP / 100) + 1;

            let updatedGamification = {
                ...state.gamification,
                xp: newXP,
                level: newLevel
            };

            // Update streak if this is the first completion today
            updatedGamification = updateStreak(updatedGamification);

            // Check for new badges
            const newBadges = checkForNewBadges(updatedGamification);
            if (newBadges.length > 0) {
                updatedGamification = {
                    ...updatedGamification,
                    badges: [...updatedGamification.badges, ...newBadges]
                };
            }

            return {
                ...state,
                completedTasks: newCompletedTasks,
                gamification: updatedGamification
            };
        }

        case 'UNDO_TASK': {
            const newCompletedTasks = state.completedTasks.filter(id => id !== action.taskId);
            const xpReward = getXPReward(action.taskType);
            const newXP = Math.max(0, state.gamification.xp - xpReward);
            const newLevel = Math.floor(newXP / 100) + 1;

            return {
                ...state,
                completedTasks: newCompletedTasks,
                gamification: {
                    ...state.gamification,
                    xp: newXP,
                    level: newLevel
                }
            };
        }

        case 'ADD_PRACTICE_LOT':
            return {
                ...state,
                practiceLots: [...state.practiceLots, action.practiceLot]
            };

        case 'ADD_TO_WATCHLIST':
            return {
                ...state,
                watchlist: [...state.watchlist, action.item]
            };

        case 'REMOVE_FROM_WATCHLIST':
            return {
                ...state,
                watchlist: state.watchlist.filter(item => item.ticker !== action.ticker)
            };

        case 'UNLOCK_BADGE':
            return {
                ...state,
                gamification: {
                    ...state.gamification,
                    badges: [...state.gamification.badges, action.badge]
                }
            };

        default:
            return state;
    }
};

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    completeTask: (taskId: string, taskType: string) => void;
    undoTask: (taskId: string, taskType: string) => void;
    addPracticeLot: (practiceLot: PracticeLot) => void;
    addToWatchlist: (ticker: string, item: any) => void;
    removeFromWatchlist: (ticker: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initialize app state from localStorage
    useEffect(() => {
        dispatch({ type: 'INIT_APP' });
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        saveAppState(state);
    }, [state]);

    const completeTask = (taskId: string, taskType: string) => {
        dispatch({ type: 'COMPLETE_TASK', taskId, taskType });
    };

    const undoTask = (taskId: string, taskType: string) => {
        dispatch({ type: 'UNDO_TASK', taskId, taskType });
    };

    const addPracticeLot = (practiceLot: PracticeLot) => {
        dispatch({ type: 'ADD_PRACTICE_LOT', practiceLot });
    };

    const addToWatchlist = (ticker: string, item: any) => {
        dispatch({ type: 'ADD_TO_WATCHLIST', ticker, item });
    };

    const removeFromWatchlist = (ticker: string) => {
        dispatch({ type: 'REMOVE_FROM_WATCHLIST', ticker });
    };

    const value: AppContextType = {
        state,
        dispatch,
        completeTask,
        undoTask,
        addPracticeLot,
        addToWatchlist,
        removeFromWatchlist
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
