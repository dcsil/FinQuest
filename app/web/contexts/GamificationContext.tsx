/**
 * Gamification Context for managing XP, levels, streaks, and badges
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gamificationApi, type GamificationStateResponse, type BadgeInfo } from '@/lib/api';
import { useAuth } from './AuthContext';
import { BadgeEarnedModal } from '@/components/BadgeEarnedModal';

interface GamificationContextType {
    totalXp: number;
    level: number;
    currentStreak: number;
    xpToNextLevel: number;
    badges: BadgeInfo[];
    loading: boolean;
    refreshState: () => Promise<void>;
    showXpToast: (xp: number) => void;
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
    const [xpToastQueue, setXpToastQueue] = useState<Array<{ id: number; xp: number }>>([]);
    const [streakToast, setStreakToast] = useState<number | null>(null);
    const [badgeModal, setBadgeModal] = useState<BadgeInfo[] | null>(null);
    const [levelUpToast, setLevelUpToast] = useState(false);
    const [toastIdCounter, setToastIdCounter] = useState(0);

    const showXpToast = (xp: number) => {
        const id = toastIdCounter;
        setToastIdCounter((prev) => prev + 1);
        setXpToastQueue((prev) => [...prev, { id, xp }]);
        // Auto-remove after 3 seconds
        setTimeout(() => {
            setXpToastQueue((prev) => prev.filter((item) => item.id !== id));
        }, 3000);
    };

    const showStreakToast = (streak: number) => {
        setStreakToast(streak);
        setTimeout(() => {
            setStreakToast(null);
        }, 4000);
    };

    const showBadgeModal = (badges: BadgeInfo[]) => {
        setBadgeModal(badges);
    };

    const showLevelUpToast = () => {
        setLevelUpToast(true);
        setTimeout(() => {
            setLevelUpToast(false);
        }, 5000);
    };

    const refreshState = async () => {
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
    };

    useEffect(() => {
        if (user) {
            refreshState();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Listen for login events
    useEffect(() => {
        const handleLogin = () => {
            if (user) {
                gamificationApi.sendEvent({ event_type: 'login' }).then((response) => {
                    if (response) {
                        if (response.xp_gained > 0) {
                            showXpToast(response.xp_gained);
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
                showStreakToast,
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
                        <XpToast key={item.id} xp={item.xp} />
                    ))}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {streakToast !== null && <StreakToast streak={streakToast} />}
            </AnimatePresence>
            <BadgeEarnedModal
                badges={badgeModal || []}
                opened={badgeModal !== null && badgeModal.length > 0}
                onClose={() => setBadgeModal(null)}
            />
            <AnimatePresence>
                {levelUpToast && <LevelUpToast />}
            </AnimatePresence>
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
const XpToast = ({ xp }: { xp: number }) => (
    <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.8 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 600,
        }}
    >
        +{xp} XP
    </motion.div>
);

const StreakToast = ({ streak }: { streak: number }) => (
    <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
        style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 600,
            fontSize: '16px',
        }}
    >
        🔥 Streak increased to {streak} days!
    </motion.div>
);

const LevelUpToast = () => (
    <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.8 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
        style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            color: 'white',
            padding: '20px 32px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 700,
            fontSize: '20px',
        }}
    >
        🎉 Level Up!
    </motion.div>
);

