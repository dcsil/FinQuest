/**
 * Gamification Context for managing XP, levels, streaks, and badges
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMantineColorScheme } from '@mantine/core';
import { gamificationApi, type GamificationStateResponse, type BadgeInfo } from '@/lib/api';
import { useAuth } from './AuthContext';
import { BadgeEarnedModal } from '@/components/BadgeEarnedModal';
import { LevelUpModal } from '@/components/LevelUpModal';
import { StreakModal } from '@/components/StreakModal';

interface GamificationContextType {
    totalXp: number;
    level: number;
    currentStreak: number;
    xpToNextLevel: number;
    badges: BadgeInfo[];
    loading: boolean;
    refreshState: () => Promise<void>;
    showXpToast: (xp: number, source?: string) => void;
    showStreakToast: (streak: number) => void;
    showBadgeModal: (badges: BadgeInfo[]) => void;
    showLevelUpToast: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [state, setState] = useState<GamificationStateResponse>({
        total_xp: 0,
        level: 1,
        current_streak: 0,
        xp_to_next_level: 200,
        badges: [],
    });
    const [loading, setLoading] = useState(true);
    const [xpToastQueue, setXpToastQueue] = useState<Array<{ id: number; xp: number; source?: string }>>([]);
    const [streakModal, setStreakModal] = useState<{ opened: boolean; streak: number }>({ opened: false, streak: 0 });
    const [badgeModal, setBadgeModal] = useState<BadgeInfo[] | null>(null);
    const [levelUpModal, setLevelUpModal] = useState<{ opened: boolean; level: number }>({ opened: false, level: 1 });
    const toastIdCounterRef = useRef(0);

    const showXpToast = useCallback((xp: number, source?: string) => {
        const id = toastIdCounterRef.current;
        toastIdCounterRef.current += 1;
        setXpToastQueue((prev) => [...prev, { id, xp, source }]);
        // Auto-remove after 3 seconds
        setTimeout(() => {
            setXpToastQueue((prev) => prev.filter((item) => item.id !== id));
        }, 3000);
    }, []);

    const showStreakModal = useCallback((streak: number) => {
        setStreakModal({ opened: true, streak });
    }, []);

    const showBadgeModal = useCallback((badges: BadgeInfo[]) => {
        setBadgeModal(badges);
    }, []);

    const showLevelUpToast = useCallback(() => {
        setLevelUpModal({ opened: true, level: state.level });
    }, [state.level]);

    const refreshState = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const data = await gamificationApi.getState();
            setState(data);
        } catch (error) {
            console.error('Failed to fetch gamification state:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            refreshState();
        } else {
            setLoading(false);
        }
    }, [user, refreshState]);

    // Listen for login events
    useEffect(() => {
        const handleLogin = () => {
            if (user) {
                gamificationApi.sendEvent({ event_type: 'login' }).then((response) => {
                    if (response) {
                        if (response.xp_gained > 0) {
                            showXpToast(response.xp_gained, 'login');
                        }
                        if (response.level_up) {
                            showLevelUpToast();
                        }
                        if (response.new_badges.length > 0) {
                            showBadgeModal(response.new_badges);
                        }
                        refreshState();
                    }
                });
            }
        };

        window.addEventListener('gamification:login', handleLogin);
        return () => {
            window.removeEventListener('gamification:login', handleLogin);
        };
    }, [user, showXpToast, showLevelUpToast, showBadgeModal, refreshState]);

    return (
        <GamificationContext.Provider
            value={{
                totalXp: state.total_xp,
                level: state.level,
                currentStreak: state.current_streak,
                xpToNextLevel: state.xp_to_next_level,
                badges: state.badges,
                loading,
                refreshState,
                showXpToast,
                showStreakToast: showStreakModal,
                showBadgeModal,
                showLevelUpToast,
            }}
        >
            {children}
            {/* Toast notifications */}
            <div
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                <AnimatePresence>
                    {xpToastQueue.map((item) => (
                        <XpToast key={item.id} xp={item.xp} source={item.source} />
                    ))}
                </AnimatePresence>
            </div>
            <BadgeEarnedModal
                badges={badgeModal || []}
                opened={badgeModal !== null && badgeModal.length > 0}
                onClose={() => setBadgeModal(null)}
            />
            <LevelUpModal
                opened={levelUpModal.opened}
                onClose={() => setLevelUpModal({ opened: false, level: levelUpModal.level })}
                newLevel={levelUpModal.level}
            />
            <StreakModal
                opened={streakModal.opened}
                onClose={() => setStreakModal({ opened: false, streak: streakModal.streak })}
                streak={streakModal.streak}
            />
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};

// Toast components with Framer Motion animations
const XpToast = ({ xp, source }: { xp: number; source?: string }) => {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const getSourceText = (source?: string): string => {
        if (!source) return '';
        const sourceMap: Record<string, string> = {
            login: 'Daily login',
            module_completed: 'Module completed',
            quiz_completed: 'Quiz completed',
            portfolio_position_added: 'Portfolio position added',
            portfolio_position_updated: 'Portfolio position updated',
            streak_bonus: 'Streak bonus',
        };
        return sourceMap[source] || source;
    };

    const sourceText = getSourceText(source);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, #4c6ef5 0%, #5c3fa0 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
                fontWeight: 600,
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            }}
        >
            {sourceText && (
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {sourceText}:
                </div>
            )}
            <div style={{ fontSize: '16px' }}>
                +{xp} XP
            </div>
        </motion.div>
    );
};

