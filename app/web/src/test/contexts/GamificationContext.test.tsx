import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import { GamificationProvider, useGamification } from '@/contexts/GamificationContext'
import { gamificationApi } from '@/lib/api'
import type { GamificationStateResponse } from '@/lib/api'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}))

vi.mock('@/lib/api', () => ({
    gamificationApi: {
        getState: vi.fn(),
        sendEvent: vi.fn(),
    },
}))

const TestComponent = () => {
    const { totalXp, level, currentStreak, xpToNextLevel, badges, loading, refreshState, showXpToast, showBadgeModal, showLevelUpToast } = useGamification()
    return (
        <div>
            <div data-testid="totalXp">{totalXp}</div>
            <div data-testid="level">{level}</div>
            <div data-testid="currentStreak">{currentStreak}</div>
            <div data-testid="xpToNextLevel">{xpToNextLevel}</div>
            <div data-testid="badges">{badges.length}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
            <button onClick={refreshState}>Refresh</button>
            <button onClick={() => showXpToast(100, 'test')}>Show XP</button>
            <button onClick={() => showBadgeModal([{ code: 'test', name: 'Test', description: 'Test badge' }])}>Show Badge</button>
            <button onClick={showLevelUpToast}>Level Up</button>
        </div>
    )
}

describe('GamificationContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('provides default state when user is not authenticated', async () => {
        mockAuthContext.user = null as unknown as { id: string; email: string }
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        }, { timeout: 3000 })
    })

    it('fetches state when user is authenticated', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        const mockState: GamificationStateResponse = {
            total_xp: 500,
            level: 3,
            current_streak: 5,
            xp_to_next_level: 100,
            badges: [],
        }
        vi.mocked(gamificationApi.getState).mockResolvedValue(mockState)
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('totalXp')).toHaveTextContent('500')
            expect(screen.getByTestId('level')).toHaveTextContent('3')
            expect(screen.getByTestId('currentStreak')).toHaveTextContent('5')
            expect(screen.getByTestId('xpToNextLevel')).toHaveTextContent('100')
        }, { timeout: 3000 })
    })

    it('refreshes state when refreshState is called', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        const mockState: GamificationStateResponse = {
            total_xp: 500,
            level: 3,
            current_streak: 5,
            xp_to_next_level: 100,
            badges: [],
        }
        vi.mocked(gamificationApi.getState).mockResolvedValue(mockState)
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('totalXp')).toHaveTextContent('500')
        }, { timeout: 3000 })
        const refreshButton = screen.getByText('Refresh')
        await refreshButton.click()
        await waitFor(() => {
            expect(gamificationApi.getState).toHaveBeenCalledTimes(2)
        }, { timeout: 3000 })
    })

    it('shows XP toast', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(gamificationApi.getState).mockResolvedValue({
            total_xp: 0,
            level: 1,
            current_streak: 0,
            xp_to_next_level: 200,
            badges: [],
        })
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        }, { timeout: 3000 })
        const showXpButton = screen.getByText('Show XP')
        await showXpButton.click()
        await waitFor(() => {
            expect(screen.getByText('+100 XP')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('shows badge modal', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(gamificationApi.getState).mockResolvedValue({
            total_xp: 0,
            level: 1,
            current_streak: 0,
            xp_to_next_level: 200,
            badges: [],
        })
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        }, { timeout: 3000 })
        const showBadgeButton = screen.getByText('Show Badge')
        await showBadgeButton.click()
        await waitFor(() => {
            expect(screen.getByText('🏆 Badge Earned!')).toBeInTheDocument()
            expect(screen.getByText('Test')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('shows level up modal', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(gamificationApi.getState).mockResolvedValue({
            total_xp: 0,
            level: 5,
            current_streak: 0,
            xp_to_next_level: 200,
            badges: [],
        })
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        }, { timeout: 3000 })
        const levelUpButton = screen.getByText('Level Up')
        await levelUpButton.click()
        await waitFor(() => {
            expect(screen.getByText('Level Up!')).toBeInTheDocument()
            expect(screen.getByText("You've reached Level 5!")).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('handles login event', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(gamificationApi.getState).mockResolvedValue({
            total_xp: 0,
            level: 1,
            current_streak: 0,
            xp_to_next_level: 200,
            badges: [],
        })
        vi.mocked(gamificationApi.sendEvent).mockResolvedValue({
            total_xp: 10,
            level: 1,
            current_streak: 1,
            xp_gained: 10,
            level_up: false,
            streak_incremented: false,
            new_badges: [],
            xp_to_next_level: 190,
        })
        render(
            <GamificationProvider>
                <TestComponent />
            </GamificationProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        }, { timeout: 3000 })
        window.dispatchEvent(new CustomEvent('gamification:login'))
        await waitFor(() => {
            expect(gamificationApi.sendEvent).toHaveBeenCalledWith({ event_type: 'login' })
        }, { timeout: 3000 })
    })

    it('throws error when used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { })
        expect(() => {
            render(<TestComponent />)
        }).toThrow()
        consoleError.mockRestore()
    })
})


