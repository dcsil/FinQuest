import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { AddPositionDialog } from '@/components/AddPositionDialog'
import { portfolioApi } from '@/lib/api'
import { useGamificationEvents } from '@/hooks/useGamificationEvents'

vi.mock('@/lib/api', () => ({
    portfolioApi: {
        addPosition: vi.fn(),
    },
}))

vi.mock('@/hooks/useGamificationEvents', () => ({
    useGamificationEvents: vi.fn(),
}))

describe('AddPositionDialog', () => {
    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockTriggerPortfolioPositionAdded = vi.fn().mockResolvedValue(undefined)

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useGamificationEvents).mockReturnValue({
            triggerEvent: vi.fn(),
            triggerLogin: vi.fn(),
            triggerModuleCompleted: vi.fn(),
            triggerQuizCompleted: vi.fn(),
            triggerPortfolioPositionAdded: mockTriggerPortfolioPositionAdded,
            triggerPortfolioPositionUpdated: vi.fn(),
        })
    })

    it('renders dialog when opened', () => {
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        // Use getAllByText since "Add Position" appears in both title and button
        expect(screen.getAllByText('Add Position').length).toBeGreaterThan(0)
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/average cost/i)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        render(<AddPositionDialog opened={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        expect(screen.queryByText('Add Position')).not.toBeInTheDocument()
    })

    it('validates required fields', async () => {
        const user = userEvent.setup()
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const submitButton = screen.getByRole('button', { name: /add position/i })
        await user.click(submitButton)
        await waitFor(() => {
            expect(screen.getByText(/ticker symbol is required/i)).toBeInTheDocument()
        })
    })

    it('validates quantity > 0', async () => {
        const user = userEvent.setup()
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const symbolInput = screen.getByLabelText(/ticker symbol/i)
        await user.type(symbolInput, 'AAPL')
        const submitButton = screen.getByRole('button', { name: /add position/i })
        await user.click(submitButton)
        await waitFor(() => {
            expect(screen.getByText(/quantity must be greater than 0/i)).toBeInTheDocument()
        })
    })

    it('validates average cost > 0', async () => {
        const user = userEvent.setup()
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const symbolInput = screen.getByLabelText(/ticker symbol/i)
        const quantityInput = screen.getByLabelText(/quantity/i)
        await user.type(symbolInput, 'AAPL')
        await user.clear(quantityInput)
        await user.type(quantityInput, '10')
        const submitButton = screen.getByRole('button', { name: /add position/i })
        await user.click(submitButton)
        await waitFor(() => {
            expect(screen.getByText(/average cost must be greater than 0/i)).toBeInTheDocument()
        })
    })

    it('submits form successfully', async () => {
        const user = userEvent.setup()
        vi.mocked(portfolioApi.addPosition).mockResolvedValue({
            id: '123',
            symbol: 'AAPL',
            quantity: 10,
            avgCost: 180,
        })
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const symbolInput = screen.getByLabelText(/ticker symbol/i)
        const quantityInput = screen.getByLabelText(/quantity/i)
        const avgCostInput = screen.getByLabelText(/average cost/i)
        await user.type(symbolInput, 'AAPL')
        await user.clear(quantityInput)
        await user.type(quantityInput, '10')
        await user.clear(avgCostInput)
        await user.type(avgCostInput, '180')
        const submitButton = screen.getByRole('button', { name: /add position/i })
        await user.click(submitButton)
        await waitFor(() => {
            expect(portfolioApi.addPosition).toHaveBeenCalledWith({
                symbol: 'AAPL',
                quantity: 10,
                avgCost: 180,
                executedAt: undefined,
            })
        })
        await waitFor(() => {
            expect(mockTriggerPortfolioPositionAdded).toHaveBeenCalled()
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles API errors', async () => {
        const user = userEvent.setup()
        vi.mocked(portfolioApi.addPosition).mockRejectedValue(new Error('API Error'))
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const symbolInput = screen.getByLabelText(/ticker symbol/i)
        const quantityInput = screen.getByLabelText(/quantity/i)
        const avgCostInput = screen.getByLabelText(/average cost/i)
        await user.type(symbolInput, 'AAPL')
        await user.clear(quantityInput)
        await user.type(quantityInput, '10')
        await user.clear(avgCostInput)
        await user.type(avgCostInput, '180')
        const submitButton = screen.getByRole('button', { name: /add position/i })
        await user.click(submitButton)
        await waitFor(() => {
            expect(screen.getByText(/API Error/i)).toBeInTheDocument()
        })
    })

    it('resets form on close', async () => {
        const user = userEvent.setup()
        render(<AddPositionDialog opened={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)
        const symbolInput = screen.getByLabelText(/ticker symbol/i) as HTMLInputElement
        await user.type(symbolInput, 'AAPL')
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        await user.click(cancelButton)
        expect(mockOnClose).toHaveBeenCalled()
    })
})


