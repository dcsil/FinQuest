import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import Login from '@/pages/login'
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

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
    })

    it('renders login form', () => {
        render(<Login />)
        expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0)
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        const buttons = screen.getAllByRole('button')
        const signInButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('sign in'))
        expect(signInButton).toBeInTheDocument()
    })

    it('handles email input', async () => {
        const user = userEvent.setup()
        render(<Login />)
        const emailInput = screen.getByLabelText(/email/i)
        await user.type(emailInput, 'test@example.com')
        expect(emailInput).toHaveValue('test@example.com')
    })

    it('handles password input', async () => {
        const user = userEvent.setup()
        render(<Login />)
        const passwordInput = screen.getByLabelText(/password/i)
        await user.type(passwordInput, 'password123')
        expect(passwordInput).toHaveValue('password123')
    })

    it('submits form with email and password', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signIn).mockResolvedValue({ error: null })
        render(<Login />)
        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i)
        const buttons = screen.getAllByRole('button')
        const submitButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('sign in'))
        expect(submitButton).toBeInTheDocument()
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        if (submitButton) {
            await user.click(submitButton)
            await waitFor(() => {
                expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
            })
        }
    })

    it('displays error message when login fails', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signIn).mockResolvedValue({
            error: { message: 'Invalid credentials' } as unknown as { message: string },
        })
        render(<Login />)
        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i)
        const submitButton = screen.getByRole('button', { name: /sign in/i })
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')
        await user.click(submitButton)
        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
        })
    })

    it('handles Google sign in', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signInWithGoogle).mockResolvedValue({ error: null })
        render(<Login />)
        const googleButton = screen.getByRole('button', { name: /continue with google/i })
        await user.click(googleButton)
        await waitFor(() => {
            expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled()
        })
    })

    it('displays error message when Google sign in fails', async () => {
        const user = userEvent.setup()
        vi.mocked(mockAuthContext.signInWithGoogle).mockResolvedValue({
            error: { message: 'Google sign in failed' } as unknown as { message: string },
        })
        render(<Login />)
        const googleButton = screen.getByRole('button', { name: /continue with google/i })
        await user.click(googleButton)
        await waitFor(() => {
            expect(screen.getByText(/google sign in failed/i)).toBeInTheDocument()
        })
    })

    it('shows loading state during sign in', async () => {
        const user = userEvent.setup()
        let resolveSignIn: (value: { error: null } | { error: { message: string } }) => void
        const signInPromise = new Promise<{ error: null } | { error: { message: string } }>(resolve => {
            resolveSignIn = resolve
        })
        vi.mocked(mockAuthContext.signIn).mockReturnValue(signInPromise)
        render(<Login />)
        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i)
        const buttons = screen.getAllByRole('button')
        const submitButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('sign in'))
        expect(submitButton).toBeInTheDocument()
        if (submitButton) {
            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')
            await user.click(submitButton)
            // Button should be disabled during loading
            expect(submitButton).toBeDisabled()
            resolveSignIn!({ error: null })
            await waitFor(() => {
                expect(submitButton).not.toBeDisabled()
            })
        }
    })

    it('has link to signup page', () => {
        render(<Login />)
        const signupLink = screen.getByRole('link', { name: /sign up/i })
        expect(signupLink).toBeInTheDocument()
        expect(signupLink).toHaveAttribute('href', '/signup')
    })
})

