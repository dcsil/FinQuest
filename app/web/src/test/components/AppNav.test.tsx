import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { AppNav } from '@/components/AppNav'
import { mockRouter } from '../test-utils'
import { AppShell } from '@mantine/core'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

const mockGamificationContext = {
    totalXp: 500,
    level: 3,
    currentStreak: 5,
    xpToNextLevel: 100,
    badges: [],
    loading: false,
    refreshState: vi.fn(),
    showXpToast: vi.fn(),
    showStreakToast: vi.fn(),
    showBadgeModal: vi.fn(),
    showLevelUpToast: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}))

vi.mock('@/contexts/GamificationContext', () => ({
    useGamification: () => mockGamificationContext,
}))

describe('AppNav', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.pathname = '/dashboard'
    })

    it('renders logo and navigation links', () => {
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        expect(screen.getByText('FinQuest')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /portfolio/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /learn/i })).toBeInTheDocument()
    })

    it('navigates to dashboard when clicked', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const dashboardButton = screen.getByRole('button', { name: /dashboard/i })
        await user.click(dashboardButton)
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('navigates to portfolio when clicked', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const portfolioButton = screen.getByRole('button', { name: /portfolio/i })
        await user.click(portfolioButton)
        expect(mockRouter.push).toHaveBeenCalledWith('/portfolio')
    })

    it('navigates to learn when clicked', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const learnButton = screen.getByRole('button', { name: /learn/i })
        await user.click(learnButton)
        expect(mockRouter.push).toHaveBeenCalledWith('/learn')
    })

    it('shows user email in menu', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const avatar = screen.getByText('T')
        await user.click(avatar)
        await waitFor(() => {
            expect(screen.getByText('test@example.com')).toBeInTheDocument()
        })
    })

    it('navigates to profile when profile menu item is clicked', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const avatar = screen.getByText('T')
        await user.click(avatar)
        await waitFor(() => {
            expect(screen.getByText(/profile/i)).toBeInTheDocument()
        })
        const profileItem = screen.getByText(/profile/i)
        await user.click(profileItem)
        expect(mockRouter.push).toHaveBeenCalledWith('/profile')
    })

    it('calls signOut when logout is clicked', async () => {
        const user = userEvent.setup()
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        const avatar = screen.getByText('T')
        await user.click(avatar)
        await waitFor(() => {
            expect(screen.getByText(/logout/i)).toBeInTheDocument()
        })
        const logoutItem = screen.getByText(/logout/i)
        await user.click(logoutItem)
        expect(mockAuthContext.signOut).toHaveBeenCalled()
    })

    it('displays level badge', () => {
        mockGamificationContext.level = 5
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        // Level appears in both streak indicator and badge, so use getAllByText
        expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    })

    it('shows loading skeleton when gamification is loading', () => {
        mockGamificationContext.loading = true
        render(
            <AppShell>
                <AppNav />
            </AppShell>
        )
        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0)
    })
})

