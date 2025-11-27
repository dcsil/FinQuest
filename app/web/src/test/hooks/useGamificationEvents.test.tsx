import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '../test-utils'
import { useGamificationEvents } from '@/hooks/useGamificationEvents'
import { gamificationApi } from '@/lib/api'
import type { GamificationEventResponse } from '@/lib/api'

const mockGamificationContext = {
    totalXp: 500,
    level: 3,
    currentStreak: 5,
    xpToNextLevel: 100,
    badges: [],
    loading: false,
    refreshState: vi.fn().mockResolvedValue(undefined),
    showXpToast: vi.fn(),
    showStreakToast: vi.fn(),
    showBadgeModal: vi.fn(),
    showLevelUpToast: vi.fn(),
}

vi.mock('@/contexts/GamificationContext', () => ({
    useGamification: () => mockGamificationContext,
}))

vi.mock('@/lib/api', () => ({
    gamificationApi: {
        sendEvent: vi.fn(),
    },
}))

describe('useGamificationEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('triggers login event', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 510,
            level: 3,
            current_streak: 5,
            xp_gained: 10,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 90,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerLogin()
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({ event_type: 'login' })
            expect(mockGamificationContext.showXpToast).toHaveBeenCalledWith(10, 'login')
            expect(mockGamificationContext.refreshState).toHaveBeenCalled()
        })
    })

    it('triggers module completed event', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 520,
            level: 3,
            current_streak: 5,
            xp_gained: 20,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 80,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerModuleCompleted('module-1', true)
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({
                event_type: 'module_completed',
                module_id: 'module-1',
                is_first_time_for_module: true,
            })
            expect(mockGamificationContext.showXpToast).toHaveBeenCalledWith(20, 'module_completed')
        })
    })

    it('triggers quiz completed event', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 530,
            level: 3,
            current_streak: 6,
            xp_gained: 12,
            level_up: false,
            streak_incremented: true,
            new_badges: [],
            xp_to_next_level: 70,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerQuizCompleted(85)
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({
                event_type: 'quiz_completed',
                quiz_score: 85,
                quiz_completed_at: expect.any(String),
            })
            expect(mockGamificationContext.showXpToast).toHaveBeenCalledWith(10, 'quiz_completed')
            expect(mockGamificationContext.showXpToast).toHaveBeenCalledWith(2, 'streak_bonus')
            expect(mockGamificationContext.showStreakToast).toHaveBeenCalledWith(6)
        })
    })

    it('shows level up toast when level up occurs', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 600,
            level: 4,
            current_streak: 5,
            xp_gained: 100,
            level_up: true,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 200,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerLogin()
        await waitFor(() => {
            expect(mockGamificationContext.showLevelUpToast).toHaveBeenCalled()
        })
    })

    it('shows badge modal when badges are earned', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 550,
            level: 3,
            current_streak: 5,
            xp_gained: 50,
            level_up: false,
            streak_incremented: false,
            new_badges: [
                { code: 'first_quiz', name: 'First Quiz', description: 'Complete your first quiz' },
            ],
            xp_to_next_level: 50,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerLogin()
        await waitFor(() => {
            expect(mockGamificationContext.showBadgeModal).toHaveBeenCalledWith([
                { code: 'first_quiz', name: 'First Quiz', description: 'Complete your first quiz' },
            ])
        })
    })

    it('triggers portfolio position added event', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 540,
            level: 3,
            current_streak: 5,
            xp_gained: 40,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 60,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerPortfolioPositionAdded('position-1')
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({
                event_type: 'portfolio_position_added',
                portfolio_position_id: 'position-1',
            })
        })
    })

    it('triggers portfolio position updated event', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 545,
            level: 3,
            current_streak: 5,
            xp_gained: 5,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 55,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerPortfolioPositionUpdated('position-1')
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({
                event_type: 'portfolio_position_updated',
                portfolio_position_id: 'position-1',
            })
        })
    })

    it('handles API errors gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(gamificationApi.sendEvent).mockRejectedValue(new Error('API Error'))
        const { result } = renderHook(() => useGamificationEvents())
        const response = await result.current.triggerLogin()
        expect(response).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('does not show XP toast when xp_gained is 0', async () => {
        const mockResponse: GamificationEventResponse = {
            total_xp: 500,
            level: 3,
            current_streak: 5,
            xp_gained: 0,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 100,
        }
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useGamificationEvents())
        await result.current.triggerLogin()
        await waitFor(() => {
            expect(mockGamificationContext.showXpToast).not.toHaveBeenCalled()
        })
    })
})

