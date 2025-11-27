import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import { StreakIndicator } from '@/components/StreakIndicator'

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

vi.mock('@/contexts/GamificationContext', () => ({
    useGamification: () => mockGamificationContext,
}))

describe('StreakIndicator', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading skeleton when loading is true (compact)', () => {
        mockGamificationContext.loading = true
        render(<StreakIndicator compact />)
        expect(document.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(2)
    })

    it('renders loading skeleton when loading is true (full)', () => {
        mockGamificationContext.loading = true
        render(<StreakIndicator />)
        expect(document.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(2)
    })

    it('returns null when streak is 0', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        const { container } = render(<StreakIndicator />)
        // Component returns null, but container may have style tags from Mantine
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('streak')
        expect(textContent).not.toContain('day')
    })

    it('renders streak indicator when streak > 0 (compact)', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 5
        render(<StreakIndicator compact />)
        expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders streak indicator when streak > 0 (full)', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 7
        render(<StreakIndicator />)
        expect(screen.getByText('7-day streak')).toBeInTheDocument()
    })

    it('displays correct text for single day streak', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 1
        render(<StreakIndicator />)
        expect(screen.getByText('1-day streak')).toBeInTheDocument()
    })

    it('displays correct text for multiple day streak', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 10
        render(<StreakIndicator />)
        expect(screen.getByText('10-day streak')).toBeInTheDocument()
    })
})

