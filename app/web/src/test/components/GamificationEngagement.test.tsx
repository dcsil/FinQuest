import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import { GamificationEngagement } from '@/components/GamificationEngagement'
import { mockRouter } from '../test-utils'
import type { Suggestion } from '@/types/learning'

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

describe('GamificationEngagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading skeleton when loading', () => {
        mockGamificationContext.loading = true
        render(<GamificationEngagement />)
        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })

    it('renders loading skeleton when loadingSuggestions is true', () => {
        mockGamificationContext.loading = false
        render(<GamificationEngagement loadingSuggestions={true} />)
        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })

    it('returns null when no streak, not close to level up, and no modules', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        mockGamificationContext.xpToNextLevel = 100
        const { container } = render(<GamificationEngagement suggestions={[]} />)
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('streak')
        expect(textContent).not.toContain('XP')
    })

    it('displays streak message when streak > 0', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 5
        mockGamificationContext.xpToNextLevel = 100
        render(<GamificationEngagement suggestions={[]} />)
        expect(screen.getByText(/5-day streak/i)).toBeInTheDocument()
    })

    it('displays close to level up message when xpToNextLevel <= 50', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        mockGamificationContext.xpToNextLevel = 30
        render(<GamificationEngagement suggestions={[]} />)
        expect(screen.getByText(/30 XP away from leveling up/i)).toBeInTheDocument()
    })

    it('displays combined message when streak and close to level up', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 7
        mockGamificationContext.xpToNextLevel = 25
        render(<GamificationEngagement suggestions={[]} />)
        expect(screen.getByText(/7-day streak/i)).toBeInTheDocument()
        expect(screen.getByText(/25 XP away/i)).toBeInTheDocument()
    })

    it('displays module completion message when suggestions available', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        mockGamificationContext.xpToNextLevel = 100
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason',
                confidence: 0.8,
                status: 'pending',
                metadata: null,
            },
        ]
        render(<GamificationEngagement suggestions={suggestions} />)
        expect(screen.getByText(/Complete a new module/i)).toBeInTheDocument()
    })

    it('shows Start Learning button when suggestions available', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        mockGamificationContext.xpToNextLevel = 100
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason',
                confidence: 0.8,
                status: 'pending',
                metadata: null,
            },
        ]
        render(<GamificationEngagement suggestions={suggestions} />)
        const button = screen.getByRole('button', { name: /start learning/i })
        expect(button).toBeInTheDocument()
    })

    it('navigates to learn page when Start Learning button is clicked', async () => {
        const user = await import('@testing-library/user-event').then(m => m.default.setup())
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 0
        mockGamificationContext.xpToNextLevel = 100
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason',
                confidence: 0.8,
                status: 'pending',
                metadata: null,
            },
        ]
        render(<GamificationEngagement suggestions={suggestions} />)
        const button = screen.getByRole('button', { name: /start learning/i })
        await user.click(button)
        expect(mockRouter.push).toHaveBeenCalledWith('/learn')
    })

    it('displays combined message with streak, level up, and modules', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.currentStreak = 10
        mockGamificationContext.xpToNextLevel = 20
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason',
                confidence: 0.8,
                status: 'pending',
                metadata: null,
            },
        ]
        render(<GamificationEngagement suggestions={suggestions} />)
        expect(screen.getByText(/10-day streak/i)).toBeInTheDocument()
        expect(screen.getByText(/20 XP away/i)).toBeInTheDocument()
        expect(screen.getByText(/Complete a module to level up/i)).toBeInTheDocument()
    })
})

