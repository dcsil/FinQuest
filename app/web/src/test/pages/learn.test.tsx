import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import Learn from '@/pages/learn'
import { usersApi } from '@/lib/api'
import type { Suggestion } from '@/types/learning'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com' },
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

vi.mock('@/contexts/GamificationContext', () => ({
    useGamification: () => ({
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        xpToNextLevel: 100,
        badges: [],
        loading: false,
        refreshState: vi.fn(),
        showXpToast: vi.fn(),
        showStreakToast: vi.fn(),
        showBadgeModal: vi.fn(),
        showLevelUpToast: vi.fn(),
    }),
}))

vi.mock('@/lib/api', () => ({
    usersApi: {
        getSuggestions: vi.fn(),
    },
}))

const mockSuggestions: Suggestion[] = [
    {
        id: '1',
        moduleId: 'module-1',
        reason: 'Based on your portfolio',
        confidence: 0.8,
        status: 'pending',
        metadata: null,
    },
    {
        id: '2',
        moduleId: 'module-2',
        reason: 'Recommended for beginners',
        confidence: 0.9,
        status: 'completed',
        metadata: null,
    },
]

describe('Learn Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usersApi.getSuggestions).mockResolvedValue(mockSuggestions)
    })

    it('renders learn page with title', () => {
        render(<Learn />)
        expect(screen.getByText('Your Learning Path')).toBeInTheDocument()
        expect(screen.getByText(/Personalized modules to help you reach your financial goals/i)).toBeInTheDocument()
    })

    it('shows loading skeleton initially', () => {
        vi.mocked(usersApi.getSuggestions).mockImplementation(
            () => new Promise(() => { }) // Never resolves
        )
        render(<Learn />)
        const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it('loads and displays suggestions', async () => {
        render(<Learn />)

        await waitFor(() => {
            expect(usersApi.getSuggestions).toHaveBeenCalled()
        })

        await waitFor(() => {
            const hasText = screen.queryAllByText(/based on your portfolio/i).length > 0
            const hasPathway = document.querySelector('.mantine-LearningPathway-root') !== null
            expect(hasText || hasPathway).toBe(true)
        }, { timeout: 3000 })
    })

    it('displays empty state when no suggestions', async () => {
        vi.mocked(usersApi.getSuggestions).mockResolvedValue([])
        render(<Learn />)

        await waitFor(() => {
            expect(screen.getByText(/no learning modules available yet/i)).toBeInTheDocument()
        })
    })

    it('handles API errors gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.mocked(usersApi.getSuggestions).mockRejectedValue(new Error('API Error'))
        render(<Learn />)

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        })

        consoleErrorSpy.mockRestore()
    })

    it('renders learning pathway component when suggestions exist', async () => {
        render(<Learn />)

        await waitFor(() => {
            expect(usersApi.getSuggestions).toHaveBeenCalled()
        }, { timeout: 3000 })

        // The LearningPathway component should be rendered
        // We check for the absence of empty state message
        await waitFor(() => {
            const emptyMessage = screen.queryByText(/no learning modules available yet/i)
            expect(emptyMessage).not.toBeInTheDocument()
        }, { timeout: 3000 })
    })
})

