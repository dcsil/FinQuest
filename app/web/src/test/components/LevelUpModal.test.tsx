import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { LevelUpModal } from '@/components/LevelUpModal'

describe('LevelUpModal', () => {
    it('renders modal when opened is true', () => {
        render(<LevelUpModal opened={true} onClose={vi.fn()} newLevel={5} />)
        expect(screen.getByText('Level Up!')).toBeInTheDocument()
        expect(screen.getByText("You've reached Level 5!")).toBeInTheDocument()
        expect(screen.getByText('Keep learning and earning XP to level up even more!')).toBeInTheDocument()
    })

    it('does not render modal when opened is false', () => {
        render(<LevelUpModal opened={false} onClose={vi.fn()} newLevel={5} />)
        expect(screen.queryByText('Level Up!')).not.toBeInTheDocument()
    })

    it('calls onClose when button is clicked', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(<LevelUpModal opened={true} onClose={onClose} newLevel={3} />)
        const button = screen.getByRole('button', { name: /awesome/i })
        await user.click(button)
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('displays correct level number', () => {
        render(<LevelUpModal opened={true} onClose={vi.fn()} newLevel={10} />)
        expect(screen.getByText("You've reached Level 10!")).toBeInTheDocument()
    })

    it('renders celebration emoji', () => {
        render(<LevelUpModal opened={true} onClose={vi.fn()} newLevel={5} />)
        expect(screen.getByText('🎉')).toBeInTheDocument()
    })
})



