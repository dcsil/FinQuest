import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { StreakModal } from '@/components/StreakModal'

describe('StreakModal', () => {
    it('renders modal when opened is true', () => {
        render(<StreakModal opened={true} onClose={vi.fn()} streak={5} />)
        expect(screen.getByText('Streak Increased!')).toBeInTheDocument()
        expect(screen.getByText('5-Day Streak')).toBeInTheDocument()
        expect(screen.getByText('Keep it up! Complete a quiz every day to maintain your streak.')).toBeInTheDocument()
    })

    it('does not render modal when opened is false', () => {
        render(<StreakModal opened={false} onClose={vi.fn()} streak={5} />)
        expect(screen.queryByText('Streak Increased!')).not.toBeInTheDocument()
    })

    it('calls onClose when button is clicked', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(<StreakModal opened={true} onClose={onClose} streak={7} />)
        const button = screen.getByRole('button', { name: /awesome/i })
        await user.click(button)
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('displays correct streak number', () => {
        render(<StreakModal opened={true} onClose={vi.fn()} streak={10} />)
        expect(screen.getByText('10-Day Streak')).toBeInTheDocument()
    })

    it('renders flame emoji', () => {
        render(<StreakModal opened={true} onClose={vi.fn()} streak={5} />)
        expect(screen.getByText('🔥')).toBeInTheDocument()
    })
})



