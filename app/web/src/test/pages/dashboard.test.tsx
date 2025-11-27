import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import DashboardPage from '@/pages/dashboard'
import { portfolioApi, usersApi } from '@/lib/api'
import { AuthProvider } from '@/contexts/AuthContext'
import { GamificationProvider } from '@/contexts/GamificationContext'
import type { PortfolioHoldingsResponse, SnapshotPoint } from '@/types/portfolio'
import type { Suggestion } from '@/types/learning'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

const mockGamificationContext = {
    totalXp: 500,
    level: 3,
    currentStreak: 5,
    xpToNextLevel: 100,
    badges: [],
    loading: false,
    refreshState: vi.fn(),
    showXpToast: vi.fn(),
    showStreakToast: vi.fn(),
    showBadgeModal: vi.fn(),
    showLevelUpToast: vi.fn(),
}

vi.mock('@/contexts/AuthContext', async () => {
    const actual = await vi.importActual('@/contexts/AuthContext')
    return {
        ...actual,
        useAuth: () => mockAuthContext,
    }
})

vi.mock('@/contexts/GamificationContext', async () => {
    const actual = await vi.importActual('@/contexts/GamificationContext')
    return {
        ...actual,
        useGamification: () => mockGamificationContext,
    }
})

vi.mock('@/lib/api', () => ({
    portfolioApi: {
        getPortfolio: vi.fn(),
        getSnapshots: vi.fn(),
    },
    usersApi: {
        getSuggestions: vi.fn(),
    },
}))

const mockPortfolio: PortfolioHoldingsResponse = {
    holdings: [],
    totals: {
        totalValue: 10000,
        totalCostBasis: 9000,
        unrealizedPL: 1000,
        dailyPL: 100,
    },
    baseCurrency: 'USD',
}

const mockSnapshots: SnapshotPoint[] = [
    { asOf: '2024-01-01T00:00:00Z', totalValue: 10000 },
    { asOf: '2024-01-02T00:00:00Z', totalValue: 10100 },
]

const mockSuggestions: Suggestion[] = [
    {
        id: '1',
        moduleId: 'module-1',
        reason: 'Test suggestion',
        confidence: 0.8,
        status: 'pending',
    },
]

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(portfolioApi.getPortfolio).mockResolvedValue(mockPortfolio)
        vi.mocked(portfolioApi.getSnapshots).mockResolvedValue({ series: mockSnapshots })
        vi.mocked(usersApi.getSuggestions).mockResolvedValue(mockSuggestions)
    })

    it('renders dashboard skeleton while loading', async () => {
        vi.mocked(portfolioApi.getPortfolio).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        )
        render(<DashboardPage />)
        // Should show skeleton initially
        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })

    it('loads and displays portfolio data', async () => {
        render(<DashboardPage />)
        await waitFor(() => {
            expect(portfolioApi.getPortfolio).toHaveBeenCalled()
            expect(portfolioApi.getSnapshots).toHaveBeenCalled()
            expect(usersApi.getSuggestions).toHaveBeenCalled()
        }, { timeout: 3000 })
    })

    it('displays dashboard title', async () => {
        render(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('displays investments section', async () => {
        render(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getByText('My investments')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('handles API errors gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(portfolioApi.getPortfolio).mockRejectedValue(new Error('API Error'))
        render(<DashboardPage />)
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        }, { timeout: 3000 })
        consoleErrorSpy.mockRestore()
    })

    it('loads snapshots with correct date range for 1m', async () => {
        render(<DashboardPage />)
        await waitFor(() => {
            expect(portfolioApi.getSnapshots).toHaveBeenCalled()
        }, { timeout: 3000 })
        // Check that getSnapshots was called with date parameters
        const calls = vi.mocked(portfolioApi.getSnapshots).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        expect(calls[0][2]).toBe('daily') // granularity for 1m
    })
})

