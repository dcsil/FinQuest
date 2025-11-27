import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { BadgeEarnedModal } from '@/components/BadgeEarnedModal'
import type { BadgeInfo } from '@/lib/api'

const mockBadges: BadgeInfo[] = [
    {
        code: 'first_quiz',
        name: 'First Quiz',
        description: 'Complete your first quiz',
    },
    {
        code: 'week_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
    },
]

describe('BadgeEarnedModal', () => {
    it('returns null when badges array is empty', () => {
        const { container } = render(
            <BadgeEarnedModal badges={[]} opened={true} onClose={vi.fn()} />
        )
        // Component returns null, but container may have style tags from Mantine
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('Badge Earned')
        expect(textContent).not.toContain('🏆')
    })

    it('renders modal when opened with badges', () => {
        render(
            <BadgeEarnedModal badges={mockBadges} opened={true} onClose={vi.fn()} />
        )
        expect(screen.getByText('🏆 Badge Earned!')).toBeInTheDocument()
        expect(screen.getByText('First Quiz')).toBeInTheDocument()
        expect(screen.getByText('Complete your first quiz')).toBeInTheDocument()
        expect(screen.getByText('Week Warrior')).toBeInTheDocument()
        expect(screen.getByText('Maintain a 7-day streak')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(
            <BadgeEarnedModal badges={mockBadges} opened={true} onClose={onClose} />
        )
        const button = screen.getByRole('button', { name: /awesome/i })
        await user.click(button)
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not render modal when opened is false', () => {
        render(
            <BadgeEarnedModal badges={mockBadges} opened={false} onClose={vi.fn()} />
        )
        expect(screen.queryByText('🏆 Badge Earned!')).not.toBeInTheDocument()
    })

    it('renders multiple badges correctly', () => {
        render(
            <BadgeEarnedModal badges={mockBadges} opened={true} onClose={vi.fn()} />
        )
        const badges = screen.getAllByText(/🏅/)
        expect(badges.length).toBeGreaterThan(0)
    })
})


