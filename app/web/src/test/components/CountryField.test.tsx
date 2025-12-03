import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { CountryField } from '@/components/CountryField'

describe('CountryField Component', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined)
    const mockOnCancel = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders country field in display mode', () => {
        render(<CountryField value="US" onSave={mockOnSave} />)
        expect(screen.getByTestId('country-field-display')).toBeInTheDocument()
        expect(screen.getByText('Country')).toBeInTheDocument()
    })

    it('displays country value when provided', () => {
        render(<CountryField value="US" onSave={mockOnSave} />)
        // Should display the country label
        expect(screen.getByTestId('country-field-display')).toBeInTheDocument()
    })

    it('displays "Not specified" when no value provided', () => {
        render(<CountryField onSave={mockOnSave} />)
        expect(screen.getByText('Not specified')).toBeInTheDocument()
    })

    it('switches to edit mode when clicked', async () => {
        const user = userEvent.setup()
        render(<CountryField value="US" onSave={mockOnSave} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-field-editing')).toBeInTheDocument()
        })
    })

    it('renders edit mode with select and buttons', async () => {
        const user = userEvent.setup()
        render(<CountryField value="US" onSave={mockOnSave} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-select')).toBeInTheDocument()
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
            expect(screen.getByTestId('country-cancel-button')).toBeInTheDocument()
        })
    })

    it('saves country when save button is clicked', async () => {
        const user = userEvent.setup()
        render(<CountryField value="US" onSave={mockOnSave} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
        })
        
        const saveButton = screen.getByTestId('country-save-button')
        await user.click(saveButton)
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith('US')
        })
    })

    it('cancels editing when cancel button is clicked', async () => {
        const user = userEvent.setup()
        render(<CountryField value="US" onSave={mockOnSave} onCancel={mockOnCancel} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-cancel-button')).toBeInTheDocument()
        })
        
        const cancelButton = screen.getByTestId('country-cancel-button')
        await user.click(cancelButton)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-field-display')).toBeInTheDocument()
            expect(screen.queryByTestId('country-field-editing')).not.toBeInTheDocument()
        })
        
        expect(mockOnCancel).toHaveBeenCalled()
    })

    it('calls onCancel callback when provided', async () => {
        const user = userEvent.setup()
        render(<CountryField value="US" onSave={mockOnSave} onCancel={mockOnCancel} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-cancel-button')).toBeInTheDocument()
        })
        
        const cancelButton = screen.getByTestId('country-cancel-button')
        await user.click(cancelButton)
        
        await waitFor(() => {
            expect(mockOnCancel).toHaveBeenCalled()
        })
    })

    it('shows loading state when saving', async () => {
        const user = userEvent.setup()
        let resolveSave: () => void
        const savePromise = new Promise<void>(resolve => {
            resolveSave = resolve
        })
        const slowOnSave = vi.fn().mockReturnValue(savePromise)
        
        render(<CountryField value="US" onSave={slowOnSave} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
        })
        
        const saveButton = screen.getByTestId('country-save-button')
        await user.click(saveButton)
        
        // Check loading state
        await waitFor(() => {
            const isDisabled = saveButton.hasAttribute('disabled') || 
                             saveButton.getAttribute('data-loading') === 'true' ||
                             saveButton.classList.contains('mantine-Button-loading')
            expect(isDisabled).toBe(true)
        }, { timeout: 2000 })
        
        resolveSave!()
        
        // After save completes, should return to display mode
        await waitFor(() => {
            expect(screen.getByTestId('country-field-display')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('handles save errors gracefully', async () => {
        const user = userEvent.setup()
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const failingOnSave = vi.fn().mockRejectedValue(new Error('Save failed'))
        
        render(<CountryField value="US" onSave={failingOnSave} />)
        
        const displayField = screen.getByTestId('country-field-display')
        await user.click(displayField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
        })
        
        const saveButton = screen.getByTestId('country-save-button')
        await user.click(saveButton)
        
        await waitFor(() => {
            expect(failingOnSave).toHaveBeenCalled()
        })
        
        // Should still be in edit mode after error
        await waitFor(() => {
            expect(screen.getByTestId('country-field-editing')).toBeInTheDocument()
        })
        
        consoleErrorSpy.mockRestore()
    })
})

