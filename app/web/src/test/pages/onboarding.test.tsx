import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import Onboarding from '@/pages/onboarding'
import { mockRouter } from '../test-utils'
import { usersApi } from '@/lib/api'

const mockAuthContext = {
    user: { id: '1', email: 'test@example.com' },
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}

const mockOnboardingHook = {
    currentStep: 1,
    totalSteps: 5,
    data: {
        financialGoals: '',
        investingExperience: 1,
        age: 25,
        annualIncome: '',
        investmentAmount: '',
        riskTolerance: 'Moderate',
        country: 'US',
    },
    loading: false,
    updateData: vi.fn(),
    handleNext: vi.fn(),
    handlePrevious: vi.fn(),
    canProceed: true,
    isFirstStep: true,
}

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
}))

vi.mock('@/lib/api', () => ({
    usersApi: {
        getOnboardingStatus: vi.fn(),
        updateFinancialProfile: vi.fn(),
    },
}))

vi.mock('@/features/onboarding/hooks/useOnboarding', () => ({
    useOnboarding: () => mockOnboardingHook,
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} {...props} />
    },
}))

describe('Onboarding Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRouter.push = vi.fn()
        mockOnboardingHook.currentStep = 1
        mockOnboardingHook.canProceed = true
        mockOnboardingHook.isFirstStep = true
        mockOnboardingHook.loading = false
        vi.mocked(usersApi.getOnboardingStatus).mockResolvedValue({ completed: false })
    })

    it('renders onboarding page', () => {
        render(<Onboarding />)
        expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument()
    })

    it('renders step 1 content', () => {
        mockOnboardingHook.currentStep = 1
        render(<Onboarding />)
        expect(screen.getByText('What are your financial goals?')).toBeInTheDocument()
        expect(screen.getByText('How familiar are you with investing?')).toBeInTheDocument()
    })

    it('renders step 2 content', () => {
        mockOnboardingHook.currentStep = 2
        render(<Onboarding />)
        expect(screen.getByText("Tell us about yourself")).toBeInTheDocument()
    })

    it('renders step 3 content', () => {
        mockOnboardingHook.currentStep = 3
        render(<Onboarding />)
        expect(screen.getByText('Investment Preferences')).toBeInTheDocument()
    })

    it('renders step 4 content', () => {
        mockOnboardingHook.currentStep = 4
        render(<Onboarding />)
        expect(screen.getByText('Investment Experience')).toBeInTheDocument()
    })

    it('renders step 5 content', () => {
        mockOnboardingHook.currentStep = 5
        render(<Onboarding />)
        expect(screen.getByText('Review Your Profile')).toBeInTheDocument()
    })

    it('shows progress bar', () => {
        mockOnboardingHook.currentStep = 2
        render(<Onboarding />)
        const progressBar = document.querySelector('.mantine-Progress-root')
        expect(progressBar).toBeInTheDocument()
    })

    it('handles next button click', async () => {
        const user = userEvent.setup()
        mockOnboardingHook.currentStep = 1
        mockOnboardingHook.canProceed = true
        render(<Onboarding />)
        
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
        
        expect(mockOnboardingHook.handleNext).toHaveBeenCalled()
    })

    it('handles previous button click', async () => {
        const user = userEvent.setup()
        mockOnboardingHook.currentStep = 2
        mockOnboardingHook.isFirstStep = false
        render(<Onboarding />)
        
        const previousButton = screen.getByRole('button', { name: /previous/i })
        await user.click(previousButton)
        
        expect(mockOnboardingHook.handlePrevious).toHaveBeenCalled()
    })

    it('disables previous button on first step', () => {
        mockOnboardingHook.currentStep = 1
        mockOnboardingHook.isFirstStep = true
        render(<Onboarding />)
        
        const previousButton = screen.getByRole('button', { name: /previous/i })
        expect(previousButton).toBeDisabled()
    })

    it('shows complete button on last step', () => {
        mockOnboardingHook.currentStep = 5
        render(<Onboarding />)
        
        const completeButton = screen.getByRole('button', { name: /complete/i })
        expect(completeButton).toBeInTheDocument()
    })

    it('disables next button when cannot proceed', () => {
        mockOnboardingHook.canProceed = false
        render(<Onboarding />)
        
        const nextButton = screen.getByRole('button', { name: /next/i })
        expect(nextButton).toBeDisabled()
    })

    it('shows loading state on complete', () => {
        mockOnboardingHook.currentStep = 5
        mockOnboardingHook.loading = true
        render(<Onboarding />)
        
        const completeButton = screen.getByRole('button', { name: /complete/i })
        expect(completeButton).toHaveAttribute('data-loading', 'true')
    })

    it('redirects to dashboard if onboarding already completed', async () => {
        vi.mocked(usersApi.getOnboardingStatus).mockResolvedValue({ completed: true })
        render(<Onboarding />)
        
        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('handles sign out', async () => {
        const user = userEvent.setup()
        render(<Onboarding />)
        
        const avatar = screen.getByText('T')
        await user.click(avatar)
        
        const signOutButton = await screen.findByText(/sign out/i)
        await user.click(signOutButton)
        
        expect(mockAuthContext.signOut).toHaveBeenCalled()
    })
})


