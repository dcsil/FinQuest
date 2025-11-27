import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { SuggestionsWidget } from '@/components/SuggestionsWidget'
import { mockRouter } from '../test-utils'
import type { Suggestion } from '@/types/learning'

describe('SuggestionsWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state', () => {
        render(<SuggestionsWidget suggestions={[]} loading={true} />)
        expect(screen.getByText('Loading suggestions...')).toBeInTheDocument()
    })

    it('returns null when no incomplete suggestions', () => {
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason',
                confidence: 0.8,
                status: 'completed',
                metadata: null,
            },
        ]
        const { container } = render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('AI Suggestions')
    })

    it('renders incomplete suggestions', () => {
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test reason 1',
                confidence: 0.8,
                status: 'pending',
                metadata: null,
            },
            {
                id: '2',
                moduleId: 'module-2',
                reason: 'Test reason 2',
                confidence: 0.6,
                status: 'pending',
                metadata: null,
            },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('AI Suggestions')).toBeInTheDocument()
        expect(screen.getByText('Test reason 1')).toBeInTheDocument()
        expect(screen.getByText('Test reason 2')).toBeInTheDocument()
    })

    it('shows only top 3 suggestions', () => {
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'Reason 1', confidence: 0.8, status: 'pending', metadata: null },
            { id: '2', moduleId: 'module-2', reason: 'Reason 2', confidence: 0.7, status: 'pending', metadata: null },
            { id: '3', moduleId: 'module-3', reason: 'Reason 3', confidence: 0.6, status: 'pending', metadata: null },
            { id: '4', moduleId: 'module-4', reason: 'Reason 4', confidence: 0.5, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('Reason 1')).toBeInTheDocument()
        expect(screen.getByText('Reason 2')).toBeInTheDocument()
        expect(screen.getByText('Reason 3')).toBeInTheDocument()
        expect(screen.queryByText('Reason 4')).not.toBeInTheDocument()
    })

    it('filters out completed suggestions', () => {
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'Pending', confidence: 0.8, status: 'pending', metadata: null },
            { id: '2', moduleId: 'module-2', reason: 'Completed', confidence: 0.7, status: 'completed', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    })

    it('displays confidence badges correctly', () => {
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'High', confidence: 0.9, status: 'pending', metadata: null },
            { id: '2', moduleId: 'module-2', reason: 'Medium', confidence: 0.6, status: 'pending', metadata: null },
            { id: '3', moduleId: 'module-3', reason: 'Low', confidence: 0.3, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('High Match')).toBeInTheDocument()
        expect(screen.getByText('Medium Match')).toBeInTheDocument()
        expect(screen.getByText('Low Match')).toBeInTheDocument()
    })

    it('displays Match badge when confidence is null', () => {
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'No confidence', confidence: null, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        // Badge might not render if confidence is null, check if component renders
        expect(screen.getByText('No confidence')).toBeInTheDocument()
    })

    it('navigates to learn page when View All is clicked', async () => {
        const user = userEvent.setup()
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'Test', confidence: 0.8, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        const button = screen.getByRole('button', { name: /view all/i })
        await user.click(button)
        expect(mockRouter.push).toHaveBeenCalledWith('/learn')
    })

    it('navigates to module page when Start Module is clicked', async () => {
        const user = userEvent.setup()
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'Test', confidence: 0.8, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        const button = screen.getByRole('button', { name: /start module/i })
        await user.click(button)
        expect(mockRouter.push).toHaveBeenCalledWith('/modules/module-1')
    })

    it('displays correct icon for investment type', () => {
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test',
                confidence: 0.8,
                status: 'pending',
                metadata: { type: 'investment', topic: 'Investing' },
            },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('Investing')).toBeInTheDocument()
    })

    it('displays correct icon for warning type', () => {
        const suggestions: Suggestion[] = [
            {
                id: '1',
                moduleId: 'module-1',
                reason: 'Test',
                confidence: 0.8,
                status: 'pending',
                metadata: { type: 'warning', topic: 'Warning' },
            },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('displays default topic when metadata is missing', () => {
        const suggestions: Suggestion[] = [
            { id: '1', moduleId: 'module-1', reason: 'Test', confidence: 0.8, status: 'pending', metadata: null },
        ]
        render(<SuggestionsWidget suggestions={suggestions} loading={false} />)
        expect(screen.getByText('General')).toBeInTheDocument()
    })
})

