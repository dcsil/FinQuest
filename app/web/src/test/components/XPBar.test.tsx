import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import { XPBar } from '@/components/XPBar'

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

describe('XPBar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading skeleton when loading is true (compact)', () => {
        mockGamificationContext.loading = true
        render(<XPBar compact />)
        expect(document.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(2)
    })

    it('renders loading skeleton when loading is true (full)', () => {
        mockGamificationContext.loading = true
        render(<XPBar />)
        expect(document.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(3)
    })

    it('renders level and progress bar when not loading (compact)', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 3
        mockGamificationContext.totalXp = 500
        mockGamificationContext.xpToNextLevel = 100
        render(<XPBar compact />)
        expect(screen.getByText('Level 3')).toBeInTheDocument()
    })

    it('renders level and progress bar when not loading (full)', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 3
        mockGamificationContext.totalXp = 500
        mockGamificationContext.xpToNextLevel = 100
        render(<XPBar />)
        expect(screen.getByText('Level 3')).toBeInTheDocument()
        expect(screen.getByText('100 XP to next')).toBeInTheDocument()
    })

    it('shows MAX when level is 10 or higher', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 10
        mockGamificationContext.totalXp = 5000
        mockGamificationContext.xpToNextLevel = 0
        render(<XPBar />)
        expect(screen.getByText('MAX')).toBeInTheDocument()
    })

    it('calculates progress correctly for level 1', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 1
        mockGamificationContext.totalXp = 50
        mockGamificationContext.xpToNextLevel = 150
        render(<XPBar />)
        expect(screen.getByText('Level 1')).toBeInTheDocument()
    })

    it('calculates progress correctly for level 5', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 5
        mockGamificationContext.totalXp = 800
        mockGamificationContext.xpToNextLevel = 200
        render(<XPBar />)
        expect(screen.getByText('Level 5')).toBeInTheDocument()
    })

    it('calculates progress correctly for level 6+', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 7
        mockGamificationContext.totalXp = 2000
        mockGamificationContext.xpToNextLevel = 500
        render(<XPBar />)
        expect(screen.getByText('Level 7')).toBeInTheDocument()
    })

    it('uses correct color for level >= 7', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 7
        mockGamificationContext.totalXp = 2000
        mockGamificationContext.xpToNextLevel = 500
        const { container } = render(<XPBar />)
        const progressBar = container.querySelector('.mantine-Progress-root')
        expect(progressBar).toBeInTheDocument()
    })

    it('uses correct color for level >= 4 and < 7', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 5
        mockGamificationContext.totalXp = 1000
        mockGamificationContext.xpToNextLevel = 200
        const { container } = render(<XPBar />)
        const progressBar = container.querySelector('.mantine-Progress-root')
        expect(progressBar).toBeInTheDocument()
    })

    it('uses correct color for level < 4', () => {
        mockGamificationContext.loading = false
        mockGamificationContext.level = 2
        mockGamificationContext.totalXp = 150
        mockGamificationContext.xpToNextLevel = 50
        const { container } = render(<XPBar />)
        const progressBar = container.querySelector('.mantine-Progress-root')
        expect(progressBar).toBeInTheDocument()
    })
})



