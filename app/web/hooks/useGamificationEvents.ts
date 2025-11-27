/**
 * Hook for triggering gamification events
 */
import { useCallback } from 'react';
import { gamificationApi } from '@/lib/api';
import { useGamification } from '@/contexts/GamificationContext';

export const useGamificationEvents = () => {
    const { showXpToast, showStreakToast, showBadgeModal, showLevelUpToast, refreshState } = useGamification();

    const triggerEvent = useCallback(
        async (event: Parameters<typeof gamificationApi.sendEvent>[0]) => {
            try {
                const response = await gamificationApi.sendEvent(event);

                // Show XP toast with source
                // If streak incremented, show streak bonus XP separately
                if (response.streak_incremented && event.event_type === 'quiz_completed') {
                    // Calculate base quiz XP (without streak bonus)
                    const streakBonusXp = 2; // From XP_REWARDS
                    const baseXp = response.xp_gained - streakBonusXp;
                    if (baseXp > 0) {
                        showXpToast(baseXp, event.event_type);
                    }
                    showXpToast(streakBonusXp, 'streak_bonus');
                } else if (response.xp_gained > 0) {
                    showXpToast(response.xp_gained, event.event_type);
                }

                // Show streak modal only if streak actually incremented
                if (response.streak_incremented) {
                    showStreakToast(response.current_streak);
                }

                // Show badge modal if badges earned
                if (response.new_badges.length > 0) {
                    showBadgeModal(response.new_badges);
                }

                // Show level up toast
                if (response.level_up) {
                    showLevelUpToast();
                }

                // Refresh state
                await refreshState();

                return response;
            } catch (error) {
                console.error('Failed to send gamification event:', error);
                // Don't throw - gamification failures shouldn't break the app
                return null;
            }
        },
        [showXpToast, showStreakToast, showBadgeModal, showLevelUpToast, refreshState]
    );

    return {
        triggerEvent,
        triggerLogin: useCallback(() => triggerEvent({ event_type: 'login' }), [triggerEvent]),
        triggerModuleCompleted: useCallback(
            (moduleId: string, isFirstTime: boolean) =>
                triggerEvent({
                    event_type: 'module_completed',
                    module_id: moduleId,
                    is_first_time_for_module: isFirstTime,
                }),
            [triggerEvent]
        ),
        triggerQuizCompleted: useCallback(
            (score: number, completedAt?: string) =>
                triggerEvent({
                    event_type: 'quiz_completed',
                    quiz_score: score,
                    quiz_completed_at: completedAt || new Date().toISOString(),
                }),
            [triggerEvent]
        ),
        triggerPortfolioPositionAdded: useCallback(
            (positionId?: string) =>
                triggerEvent({
                    event_type: 'portfolio_position_added',
                    portfolio_position_id: positionId,
                }),
            [triggerEvent]
        ),
        triggerPortfolioPositionUpdated: useCallback(
            (positionId?: string) =>
                triggerEvent({
                    event_type: 'portfolio_position_updated',
                    portfolio_position_id: positionId,
                }),
            [triggerEvent]
        ),
    };
};

