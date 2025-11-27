import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '../test-utils'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { mockRouter } from '../test-utils'

const TestComponent = () => {
    const { user, session, loading, signUp, signIn, signInWithGoogle, signOut } = useAuth()
    return (
        <div>
            <div data-testid="user">{user?.email || 'null'}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
            <button onClick={() => signUp('test@example.com', 'password', 'Test User')}>Sign Up</button>
            <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
            <button onClick={signInWithGoogle}>Sign In Google</button>
            <button onClick={signOut}>Sign Out</button>
        </div>
    )
}

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signInWithOAuth: vi.fn(),
            signOut: vi.fn(),
        },
    },
}))

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: null },
            error: null,
        })
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        } as any)
    })

    it('provides initial state', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('handles sign up', async () => {
        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: { user: null, session: null },
            error: null,
        })
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        const signUpButton = screen.getByText('Sign Up')
        await signUpButton.click()
        await waitFor(() => {
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password',
                options: {
                    data: {
                        full_name: 'Test User',
                    },
                },
            })
        })
    })

    it('handles sign in', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: { id: '1', email: 'test@example.com' } as any, session: null },
            error: null,
        })
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        const signInButton = screen.getByText('Sign In')
        await signInButton.click()
        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password',
            })
            expect(mockRouter.push).toHaveBeenCalledWith('/')
        })
    })

    it('handles sign in with Google', async () => {
        vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
            data: { provider: 'google', url: 'https://example.com' },
            error: null,
        })
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        const googleButton = screen.getByText('Sign In Google')
        await googleButton.click()
        await waitFor(() => {
            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: process.env.NEXT_PUBLIC_SITE_URL,
                },
            })
        })
    })

    it('handles sign out', async () => {
        vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        const signOutButton = screen.getByText('Sign Out')
        await signOutButton.click()
        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/login')
        })
    })

    it('updates state on auth change', async () => {
        let authChangeCallback: (event: string, session: any) => void
        vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
            authChangeCallback = callback
            return {
                data: { subscription: { unsubscribe: vi.fn() } },
            } as any
        })
        const { rerender } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        })
        const mockUser = { id: '1', email: 'test@example.com' }
        const mockSession = { user: mockUser } as any
        // Use act to wrap state updates
        await act(async () => {
            authChangeCallback!('SIGNED_IN', mockSession)
        })
        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        })
    })

    it('throws error when used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => {
            render(<TestComponent />)
        }).toThrow()
        consoleError.mockRestore()
    })
})

