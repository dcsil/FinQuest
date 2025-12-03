import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import SignUp from '@/pages/signup'
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

vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: { src: string; alt: string;[key: string]: unknown }) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} {...props} />
    },
}))

describe('SignUp Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
    })

    it('renders signup form', () => {
        render(<SignUp />)
        expect(screen.getByText('Create your account')).toBeInTheDocument()
        // Form is now in SignUpForm component
        expect(screen.getByTestId('signup-fullname-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-email-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-password-input')).toBeInTheDocument()
        expect(screen.getByTestId('signup-confirm-password-input')).toBeInTheDocument()
    })

    it('handles form input changes', async () => {
        const user = userEvent.setup()
        render(<SignUp />)

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

    it.skip('shows error when passwords do not match', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        const { container } = render(<SignUp />)

        const emailInput = screen.getByLabelText(/email/i)
        // Find password inputs by their type and placeholder
        const passwordInputs = container.querySelectorAll('input[type="password"]')
        const passwordInput = passwordInputs[0] as HTMLInputElement
        const confirmPasswordInput = passwordInputs[1] as HTMLInputElement
        const submitButton = screen.getByRole('button', { name: /create account/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'differentpassword')
        await user.click(submitButton)

        await waitFor(() => {
            // Check for error message in Alert component
            const alerts = container.querySelectorAll('.mantine-Alert-root, [role="alert"]')
            const hasError = Array.from(alerts).some(alert =>
                alert.textContent?.toLowerCase().includes('passwords do not match')
            )
            expect(hasError).toBe(true)
        }, { timeout: 3000 })
        expect(mockAuthContext.signUp).not.toHaveBeenCalled()
    })

    it.skip('shows error when password is too short', async () => {
        const user = userEvent.setup()
        const { container } = render(<SignUp />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInputs = container.querySelectorAll('input[type="password"]')
        const passwordInput = passwordInputs[0] as HTMLInputElement
        const confirmPasswordInput = passwordInputs[1] as HTMLInputElement
        const submitButton = screen.getByRole('button', { name: /create account/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, '12345')
        await user.type(confirmPasswordInput, '12345')
        await user.click(submitButton)

        await waitFor(() => {
            const alerts = container.querySelectorAll('.mantine-Alert-root, [role="alert"]')
            const hasError = Array.from(alerts).some(alert =>
                alert.textContent?.toLowerCase().includes('password must be at least 6')
            )
            expect(hasError).toBe(true)
        }, { timeout: 3000 })
        expect(mockAuthContext.signUp).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })
        render(<SignUp />)

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
        render(<SignUp />)

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

    it('redirects to onboarding after successful signup', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({ error: null })

        render(<SignUp />)

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
        }, { timeout: 3000 })

        // Wait for redirect (component uses setTimeout with 2000ms delay)
        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/onboarding')
        }, { timeout: 5000 })
    })

    it('displays error message when signup fails', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signUp).mockResolvedValue({
            error: { message: 'Email already exists' } as unknown as { message: string },
        })
        render(<SignUp />)

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

    it('handles Google sign up', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signInWithGoogle).mockResolvedValue({ error: null })
        render(<SignUp />)

        const googleButton = screen.getByRole('button', { name: /sign up with google/i })
        await user.click(googleButton)

        await waitFor(() => {
            expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled()
        }, { timeout: 3000 })
    })

    it('displays error message when Google sign up fails', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signInWithGoogle).mockResolvedValue({
            error: { message: 'Google sign up failed' } as unknown as { message: string },
        })
        render(<SignUp />)

        const googleButton = screen.getByRole('button', { name: /sign up with google/i })
        await user.click(googleButton)

        await waitFor(() => {
            expect(screen.getByText(/google sign up failed/i)).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it.skip('shows loading state during signup', async () => {
        const user = userEvent.setup()
        let resolveSignUp: (value: { error: null } | { error: { message: string } }) => void
        const signUpPromise = new Promise<{ error: null } | { error: { message: string } }>(resolve => {
            resolveSignUp = resolve
        })
        vi.mocked(mockAuthContext.signUp).mockImplementation(() => signUpPromise)

        const { container } = render(<SignUp />)

        const fullNameInput = screen.getByLabelText(/full name/i)
        const emailInput = screen.getByLabelText(/email/i)
        const passwordInputs = container.querySelectorAll('input[type="password"]')
        const passwordInput = passwordInputs[0] as HTMLInputElement
        const confirmPasswordInput = passwordInputs[1] as HTMLInputElement
        const submitButton = screen.getByRole('button', { name: /create account/i })

        await user.type(fullNameInput, 'John Doe')
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password123')
        await user.click(submitButton)

        // Check that loading state is set (button should be disabled or show loading)
        await waitFor(() => {
            // Button might be disabled or have loading attribute
            const isDisabled = submitButton.hasAttribute('disabled') || submitButton.getAttribute('data-loading') === 'true'
            expect(isDisabled || submitButton.textContent?.includes('Loading')).toBeTruthy()
        }, { timeout: 2000 })

        resolveSignUp!({ error: null })

        await waitFor(() => {
            // After resolution, button should be enabled again
            expect(submitButton.hasAttribute('disabled')).toBeFalsy()
        }, { timeout: 3000 })
    })

    it('has link to login page', () => {
        render(<SignUp />)
        const loginLink = screen.getByRole('link', { name: /sign in/i })
        expect(loginLink).toBeInTheDocument()
    })

    it('navigates to login when login link is clicked', async () => {
        const user = userEvent.setup()
        render(<SignUp />)
        const loginLink = screen.getByRole('link', { name: /sign in/i })
        await user.click(loginLink)
        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login')
        }, { timeout: 2000 })
    })
})

