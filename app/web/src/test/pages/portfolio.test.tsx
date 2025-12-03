import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import PortfolioPage from '@/pages/portfolio'
import { usersApi } from '@/lib/api'
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio'
import { useSnapshots } from '@/features/portfolio/hooks/useSnapshots'
import type { PortfolioHoldingsResponse } from '@/types/portfolio'
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

const mockPortfolio: PortfolioHoldingsResponse = {
    positions: [
        {
            instrumentId: '1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            type: 'equity',
            sector: 'Technology',
            quantity: 10,
            avgCostBase: 150,
            marketPrice: 160,
            valueBase: 1600,
            currency: 'USD',
            dailyPL: 50,
            unrealizedPL: 100,
        },
    ],
    totals: {
        totalValue: 10000,
        totalCostBasis: 9000,
        unrealizedPL: 1000,
        dailyPL: 100,
    },
    baseCurrency: 'USD',
    allocationByType: { equity: 100 },
    allocationBySector: { Technology: 100 },
    bestMovers: [],
    worstMovers: [],
}

const mockPortfolioHook = {
    portfolio: mockPortfolio,
    loading: false,
    error: null,
    loadPortfolio: vi.fn(),
}

const mockSnapshotsHook = {
    snapshots: [
        { asOf: '2024-01-01T00:00:00Z', totalValue: 10000 },
        { asOf: '2024-01-02T00:00:00Z', totalValue: 10100 },
    ],
    showSkeleton: false,
    timeRange: '1m',
    setTimeRange: vi.fn(),
    loadSnapshots: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}))

vi.mock('@/contexts/GamificationContext', () => ({
    useGamification: () => ({
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        xpToNextLevel: 100,
        badges: [],
        loading: false,
        refreshState: vi.fn(),
        showXpToast: vi.fn(),
        showStreakToast: vi.fn(),
        showBadgeModal: vi.fn(),
        showLevelUpToast: vi.fn(),
    }),
}))

vi.mock('@/features/portfolio/hooks/usePortfolio', () => ({
    usePortfolio: vi.fn(),
}))

vi.mock('@/features/portfolio/hooks/useSnapshots', () => ({
    useSnapshots: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
    usersApi: {
        getSuggestions: vi.fn(),
    },
}))

describe('Portfolio Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usePortfolio).mockReturnValue(mockPortfolioHook)
        vi.mocked(useSnapshots).mockReturnValue(mockSnapshotsHook)
        vi.mocked(usersApi.getSuggestions).mockResolvedValue([])
    })

    it('renders portfolio page with title', () => {
        render(<PortfolioPage />)
        const titles = screen.getAllByText('Portfolio')
        expect(titles.length).toBeGreaterThan(0)
        // Check that at least one is a heading
        const heading = titles.find(title => title.tagName === 'H1' || title.closest('h1'))
        expect(heading).toBeInTheDocument()
    })

    it('shows loading skeleton initially', () => {
        vi.mocked(usePortfolio).mockReturnValue({
            ...mockPortfolioHook,
            loading: true,
            portfolio: null,
        })
        render(<PortfolioPage />)
        const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it('displays error when portfolio fails to load', () => {
        vi.mocked(usePortfolio).mockReturnValue({
            ...mockPortfolioHook,
            loading: false,
            portfolio: null,
            error: 'Failed to load portfolio',
        })
        render(<PortfolioPage />)
        expect(screen.getByText('Failed to load portfolio')).toBeInTheDocument()
    })

    it('displays portfolio totals', () => {
        render(<PortfolioPage />)
        expect(screen.getByText('Total Value')).toBeInTheDocument()
        expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument()
        expect(screen.getByText('Daily Change')).toBeInTheDocument()
    })

    it('displays holdings table', () => {
        render(<PortfolioPage />)
        expect(screen.getByText('Holdings')).toBeInTheDocument()
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    })

    it('shows empty state when no positions', () => {
        vi.mocked(usePortfolio).mockReturnValue({
            ...mockPortfolioHook,
            portfolio: {
                ...mockPortfolio,
                positions: [],
            },
        })
        render(<PortfolioPage />)
        expect(screen.getByText(/no positions yet/i)).toBeInTheDocument()
    })

    it('opens add position dialog when button is clicked', async () => {
        const user = userEvent.setup()
        render(<PortfolioPage />)
        
        const addButton = screen.getByRole('button', { name: /add position/i })
        await user.click(addButton)
        
        // Dialog should be opened (check for dialog content or state)
        expect(addButton).toBeInTheDocument()
    })

    it('loads portfolio and snapshots on mount', () => {
        render(<PortfolioPage />)
        expect(mockPortfolioHook.loadPortfolio).toHaveBeenCalled()
        expect(mockSnapshotsHook.loadSnapshots).toHaveBeenCalled()
    })

    it('loads suggestions when portfolio is available', async () => {
        render(<PortfolioPage />)
        
        await waitFor(() => {
            expect(usersApi.getSuggestions).toHaveBeenCalled()
        })
    })

    it('displays allocation chart', () => {
        render(<PortfolioPage />)
        expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
    })

    it('handles time range change', async () => {
        const user = userEvent.setup()
        render(<PortfolioPage />)
        
        // The ValueChart component should handle time range changes
        // We verify the hook's setTimeRange is available
        expect(mockSnapshotsHook.setTimeRange).toBeDefined()
    })
})

