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

                // Show XP toast
                if (response.xp_gained > 0) {
                    showXpToast(response.xp_gained);
                }

                // Show streak toast if streak increased
                if (event.event_type === 'quiz_completed' && response.current_streak > 0) {
                    // Check if streak actually increased by comparing with previous state
                    // For simplicity, we'll show it if current_streak > 0
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

