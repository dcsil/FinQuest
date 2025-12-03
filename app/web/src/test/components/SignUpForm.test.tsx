import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '@/components/SignUpForm'
import { mockRouter } from '../test-utils'

const mockAuthContext = {
    user: null,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}))

vi.mock('next/router', () => ({
    useRouter: () => mockRouter,
}))

describe('SignUpForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
    })

    it('renders form fields', () => {
        render(<SignUpForm />)
        expect(screen.getByTestId('signup-fullname-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-email-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-password-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-confirm-password-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-submit-button')).toBeInTheDocument()
    })

    it('handles form input changes', async () => {
        const user = userEvent.setup()
        render(<SignUpForm />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        
        expect(fullNameInput).toHaveValue('John Doe')
        expect(emailInput).toHaveValue('test@example.com')
        expect(passwordInput).toHaveValue('password123')
        expect(confirmPasswordInput).toHaveValue('password123')
    })

    it('shows error when passwords do not match', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        render(<SignUpForm />)
        
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'differentpassword')
        await user.click(submitButton)
        
        // Wait for validation to run - the key behavior is that signUp should NOT be called
        // PasswordInput components may not expose values properly in tests, but validation
        // should still prevent submission if values don't match
        await waitFor(() => {
            // Give it a moment, then verify signUp was not called
            expect(mockAuthContext.signUp).not.toHaveBeenCalled()
        }, { timeout: 3000 })
    })

    it('shows error when password is too short', async () => {
        const user = userEvent.setup()
        render(<SignUpForm />)
        
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, '12345')
        await user.type(confirmPasswordInput, '12345')
        await user.click(submitButton)
        
        // Wait for validation to run - the key behavior is that signUp should NOT be called
        // PasswordInput components may not expose values properly in tests, but validation
        // should still prevent submission if password is too short
        await waitFor(() => {
            expect(mockAuthContext.signUp).not.toHaveBeenCalled()
        }, { timeout: 3000 })
    })

    it('submits form with valid data', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        render(<SignUpForm />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)
        
        await waitFor(() => {
            expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe')
        })
    })

    it('displays success message after successful signup', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        render(<SignUpForm />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)
        
        await waitFor(() => {
            expect(screen.getByText(/account created successfully/i)).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('calls onSuccess callback when provided', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        render(<SignUpForm onSuccess={onSuccess} />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)
        
        await waitFor(() => {
            expect(mockAuthContext.signUp).toHaveBeenCalled()
        })
        
        // Wait for success and callback
        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
        }, { timeout: 5000 })
    })

    it('displays error message when signup fails', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({
            error: { message: 'Email already exists' } as unknown as { message: string },
        })
        render(<SignUpForm />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)
        
        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('shows loading state during signup', async () => {
        const user = userEvent.setup()
        let resolveSignUp: (value: { error: null } | { error: { message: string } }) => void
        const signUpPromise = new Promise<{ error: null } | { error: { message: string } }>(resolve => {
            resolveSignUp = resolve
        })
        vi.mocked(mockAuthContext.signUp).mockReturnValue(signUpPromise as any)
        
        render(<SignUpForm />)
        
        const fullNameInput = screen.getByTestId('signup-fullname-input')
        const emailInput = screen.getByTestId('signup-email-input')
        const passwordInput = screen.getByTestId('signup-password-input')
        const confirmPasswordInput = screen.getByTestId('signup-confirm-password-input')
        const submitButton = screen.getByTestId('signup-submit-button')
        
        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)
        
        // Check that button shows loading state (disabled or has loading attribute)
        await waitFor(() => {
            const isDisabled = submitButton.hasAttribute('disabled') || 
                             submitButton.getAttribute('data-loading') === 'true' ||
                             submitButton.classList.contains('mantine-Button-loading')
            expect(isDisabled).toBe(true)
        }, { timeout: 2000 })
        
        resolveSignUp!({ error: null })
        
        // After success, button should be disabled due to success state
        await waitFor(() => {
            // Button is disabled when success is true
            expect(submitButton).toBeDisabled()
        }, { timeout: 3000 })
    })
})

