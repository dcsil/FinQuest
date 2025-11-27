import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import { BadgesGrid } from '@/components/BadgesGrid'
import { gamificationApi } from '@/lib/api'
import type { BadgeDefinitionResponse } from '@/lib/api'

vi.mock('@/lib/api', () => ({
    gamificationApi: {
        getBadges: vi.fn(),
    },
}))

const mockBadges: BadgeDefinitionResponse[] = [
    {
        code: 'first_quiz',
        name: 'First Quiz',
        description: 'Complete your first quiz',
        category: 'learning',
        is_active: true,
        earned: true,
    },
    {
        code: 'week_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        category: 'streak',
        is_active: true,
        earned: true,
    },
    {
        code: 'month_streak',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        category: 'streak',
        is_active: true,
        earned: false,
    },
    {
        code: 'inactive_badge',
        name: 'Inactive Badge',
        description: 'This badge is inactive',
        category: 'other',
        is_active: false,
        earned: false,
    },
]

describe('BadgesGrid', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading state initially', () => {
        vi.mocked(gamificationApi.getBadges).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        )
        render(<BadgesGrid />)
        expect(screen.getByText('Loading badges...')).toBeInTheDocument()
    })

    it('renders earned badges', async () => {
        vi.mocked(gamificationApi.getBadges).mockResolvedValue(mockBadges)
        render(<BadgesGrid />)
        await waitFor(() => {
            expect(screen.getByText('Your Badges (2)')).toBeInTheDocument()
        })
        expect(screen.getByText('First Quiz')).toBeInTheDocument()
        expect(screen.getByText('Week Warrior')).toBeInTheDocument()
        expect(screen.getAllByText('Earned')).toHaveLength(2)
    })

    it('renders available badges section when there are unearned badges', async () => {
        vi.mocked(gamificationApi.getBadges).mockResolvedValue(mockBadges)
        render(<BadgesGrid />)
        await waitFor(() => {
            expect(screen.getByText('Available Badges')).toBeInTheDocument()
        })
        expect(screen.getByText('Month Master')).toBeInTheDocument()
        expect(screen.getByText('Locked')).toBeInTheDocument()
    })

    it('does not render inactive badges', async () => {
        vi.mocked(gamificationApi.getBadges).mockResolvedValue(mockBadges)
        render(<BadgesGrid />)
        await waitFor(() => {
            expect(screen.queryByText('Inactive Badge')).not.toBeInTheDocument()
        })
    })

    it('shows message when no badges earned', async () => {
        vi.mocked(gamificationApi.getBadges).mockResolvedValue([
            {
                code: 'unearned',
                name: 'Unearned Badge',
                description: 'Not earned yet',
                category: 'other',
                is_active: true,
                earned: false,
            },
        ])
        render(<BadgesGrid />)
        await waitFor(() => {
            expect(screen.getByText(/No badges earned yet/)).toBeInTheDocument()
        })
    })

    it('handles API errors gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(gamificationApi.getBadges).mockRejectedValue(new Error('API Error'))
        render(<BadgesGrid />)
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        })
        consoleErrorSpy.mockRestore()
    })
})


