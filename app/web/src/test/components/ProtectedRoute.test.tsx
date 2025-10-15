import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, mockRouter } from '../test-utils'
import ProtectedRoute from '@/components/ProtectedRoute'

// Mock the AuthContext
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

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading spinner when loading is true', () => {
        mockAuthContext.loading = true

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', async () => {
        mockAuthContext.loading = false
        mockAuthContext.user = null

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login')
        })

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('renders children when user is authenticated', () => {
        mockAuthContext.loading = false
        mockAuthContext.user = { id: '1', email: 'test@example.com' } as any

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(screen.getByText('Protected Content')).toBeInTheDocument()
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('does not redirect when user is authenticated', () => {
        mockAuthContext.loading = false
        mockAuthContext.user = { id: '1', email: 'test@example.com' } as any

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(mockRouter.push).not.toHaveBeenCalled()
    })
})
