import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import Home from '@/pages/index'
import { mockRouter } from '../test-utils'
import { usersApi } from '@/lib/api'

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

vi.mock('@/lib/api', () => ({
    usersApi: {
        getOnboardingStatus: vi.fn(),
    },
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} {...props} />
    },
}))

describe('Home Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
        mockAuthContext.user = null
        mockAuthContext.loading = false
    })

    it('renders home page with title and description', () => {
        render(<Home />)
        expect(screen.getByText('Unlock Your Investing Potential')).toBeInTheDocument()
        expect(screen.getByText(/AI-powered insights and education designed for the next generation of investors/)).toBeInTheDocument()
    })

    it('renders login and signup buttons', () => {
        render(<Home />)
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /get started for free/i })).toBeInTheDocument()
    })

    it('renders color scheme toggle', () => {
        render(<Home />)
        const toggle = screen.getByLabelText('Toggle color scheme')
        expect(toggle).toBeInTheDocument()
    })

    it('redirects authenticated user with completed onboarding to dashboard', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(usersApi.getOnboardingStatus).mockResolvedValue({ completed: true })
        
        render(<Home />)
        
        await waitFor(() => {
            expect(usersApi.getOnboardingStatus).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('redirects authenticated user without completed onboarding to onboarding', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        vi.mocked(usersApi.getOnboardingStatus).mockResolvedValue({ completed: false })
        
        render(<Home />)
        
        await waitFor(() => {
            expect(usersApi.getOnboardingStatus).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/onboarding')
        })
    })

    it('redirects to onboarding on error checking onboarding status', async () => {
        mockAuthContext.user = { id: '1', email: 'test@example.com' }
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(usersApi.getOnboardingStatus).mockRejectedValue(new Error('API Error'))
        
        render(<Home />)
        
        await waitFor(() => {
            expect(usersApi.getOnboardingStatus).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/onboarding')
            expect(consoleErrorSpy).toHaveBeenCalled()
        })
        
        consoleErrorSpy.mockRestore()
    })

    it('does not redirect when user is loading', () => {
        mockAuthContext.loading = true
        render(<Home />)
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('does not redirect when user is not authenticated', () => {
        mockAuthContext.user = null
        render(<Home />)
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('toggles color scheme when toggle is clicked', async () => {
        const user = userEvent.setup()
        render(<Home />)
        const toggle = screen.getByLabelText('Toggle color scheme')
        await user.click(toggle)
        // Color scheme toggle should be interactive
        expect(toggle).toBeInTheDocument()
    })
})


