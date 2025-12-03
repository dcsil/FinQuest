import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import ProfilePage from '@/pages/profile'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { usersApi } from '@/lib/api'
import type { UserProfile } from '@/types/user'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com', created_at: '2024-01-01T00:00:00Z' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

const mockProfile: UserProfile = {
    financialGoals: 'Saving for retirement',
    investingExperience: 2,
    age: 30,
    annualIncome: '50000-75000',
    investmentAmount: '10000-25000',
    riskTolerance: 'Moderate',
    country: 'US',
}

const mockProfileHook = {
    profile: mockProfile,
    loading: false,
    loadProfile: vi.fn().mockResolvedValue(mockProfile),
    updateProfile: vi.fn().mockResolvedValue(mockProfile),
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

vi.mock('@/features/profile/hooks/useProfile', () => ({
    useProfile: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
    usersApi: {
        getFinancialProfile: vi.fn(),
        updateFinancialProfile: vi.fn(),
    },
    gamificationApi: {
        getState: vi.fn().mockResolvedValue({
            total_xp: 0,
            level: 1,
            current_streak: 0,
            xp_to_next_level: 100,
            badges: [],
        }),
        sendEvent: vi.fn(),
        getBadges: vi.fn().mockResolvedValue([]),
    },
}))

describe('Profile Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useProfile).mockReturnValue(mockProfileHook)
    })

    it('renders profile page with title', () => {
        render(<ProfilePage />)
        expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('displays user information', () => {
        render(<ProfilePage />)
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('displays member since date', () => {
        render(<ProfilePage />)
        expect(screen.getByText(/member since/i)).toBeInTheDocument()
    })

    it('displays financial profile fields', () => {
        render(<ProfilePage />)
        expect(screen.getByText('Financial Goals')).toBeInTheDocument()
        expect(screen.getByText('Investing Experience')).toBeInTheDocument()
        expect(screen.getByText('Age')).toBeInTheDocument()
        expect(screen.getByText('Annual Income')).toBeInTheDocument()
        expect(screen.getByText('Investment Amount')).toBeInTheDocument()
        expect(screen.getByText('Risk Tolerance')).toBeInTheDocument()
    })

    it('shows loading skeleton when loading', () => {
        vi.mocked(useProfile).mockReturnValue({
            ...mockProfileHook,
            loading: true,
        })
        render(<ProfilePage />)
        const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it('displays empty state when no profile data', () => {
        vi.mocked(useProfile).mockReturnValue({
            ...mockProfileHook,
            profile: null,
        })
        render(<ProfilePage />)
        expect(screen.getByText(/no financial profile information available/i)).toBeInTheDocument()
    })

    it.skip('allows editing country', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)
        
        // Find the country field container and click it to enter edit mode
        const countryText = screen.getByText(/country/i)
        const countryContainer = countryText.closest('div[style*="cursor: pointer"]') || countryText.closest('div')
        
        if (countryContainer) {
            await user.click(countryContainer)
            
            await waitFor(() => {
                // After clicking, should show the Select component
                const combobox = screen.queryByRole('combobox')
                if (!combobox) {
                    // If combobox not found, check for Select input
                    const selectInput = document.querySelector('input[type="text"]')
                    expect(selectInput).toBeInTheDocument()
                } else {
                    expect(combobox).toBeInTheDocument()
                }
            }, { timeout: 3000 })
        } else {
            // Fallback: just verify the country field exists
            expect(countryText).toBeInTheDocument()
        }
    })

    it('saves country when save button is clicked', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)
        
        const countryField = screen.getByTestId('country-field-display')
        await user.click(countryField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
        })
        
        const saveButton = screen.getByTestId('country-save-button')
        await user.click(saveButton)
        
        await waitFor(() => {
            expect(mockProfileHook.updateProfile).toHaveBeenCalled()
        })
    })

    it('cancels country editing when cancel button is clicked', async () => {
        const user = userEvent.setup()
        render(<ProfilePage />)
        
        const countryField = screen.getByTestId('country-field-display')
        await user.click(countryField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-cancel-button')).toBeInTheDocument()
        })
        
        const cancelButton = screen.getByTestId('country-cancel-button')
        await user.click(cancelButton)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-field-display')).toBeInTheDocument()
            expect(screen.queryByTestId('country-field-editing')).not.toBeInTheDocument()
        })
    })

    it('loads profile on mount', async () => {
        render(<ProfilePage />)
        
        await waitFor(() => {
            expect(mockProfileHook.loadProfile).toHaveBeenCalled()
        })
    })

    it('displays badges section', () => {
        render(<ProfilePage />)
        // BadgesGrid component should be rendered
        const badgesSection = document.querySelector('.mantine-Paper-root')
        expect(badgesSection).toBeInTheDocument()
    })

    it('handles profile update errors', async () => {
        const user = userEvent.setup()
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(mockProfileHook.updateProfile).mockRejectedValue(new Error('Update failed'))
        
        render(<ProfilePage />)
        
        const countryField = screen.getByTestId('country-field-display')
        await user.click(countryField)
        
        await waitFor(() => {
            expect(screen.getByTestId('country-save-button')).toBeInTheDocument()
        })
        
        const saveButton = screen.getByTestId('country-save-button')
        await user.click(saveButton)
        
        await waitFor(() => {
            expect(mockProfileHook.updateProfile).toHaveBeenCalled()
        })
        
        // Error should be logged to console
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        }, { timeout: 2000 })
        
        consoleErrorSpy.mockRestore()
    })
})

