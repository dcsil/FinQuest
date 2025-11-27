import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '../../../test-utils'
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding'
import { usersApi } from '@/lib/api'
import { mockRouter } from '../../../test-utils'

vi.mock('@/lib/api', () => ({
    usersApi: {
        updateFinancialProfile: vi.fn(),
    },
}))

vi.mock('next/router', () => ({
    useRouter: () => mockRouter,
}))

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with default values', () => {
        const { result } = renderHook(() => useOnboarding())
        expect(result.current.currentStep).toBe(1)
        expect(result.current.totalSteps).toBe(5)
        expect(result.current.data.financialGoals).toBe('Saving for retirement')
        expect(result.current.data.age).toBe(25)
    })

    it('updates data correctly', () => {
        const { result } = renderHook(() => useOnboarding())
        act(() => {
            result.current.updateData({ age: 30 })
        })
        expect(result.current.data.age).toBe(30)
        expect(result.current.data.financialGoals).toBe('Saving for retirement') // Other fields unchanged
    })

    it('moves to next step when handleNext is called', () => {
        const { result } = renderHook(() => useOnboarding())
        act(() => {
            result.current.handleNext()
        })
        expect(result.current.currentStep).toBe(2)
    })

    it('moves to previous step when handlePrevious is called', () => {
        const { result } = renderHook(() => useOnboarding())
        act(() => {
            result.current.handleNext()
        })
        expect(result.current.currentStep).toBe(2)
        act(() => {
            result.current.handlePrevious()
        })
        expect(result.current.currentStep).toBe(1)
    })

    it('does not go below step 1', () => {
        const { result } = renderHook(() => useOnboarding())
        act(() => {
            result.current.handlePrevious()
        })
        expect(result.current.currentStep).toBe(1)
    })

    it('completes onboarding on last step', async () => {
        vi.mocked(usersApi.updateFinancialProfile).mockResolvedValue({ success: true } as unknown as Awaited<ReturnType<typeof usersApi.updateFinancialProfile>>)
        const { result } = renderHook(() => useOnboarding())
        act(() => {
            result.current.updateData({ financialGoals: 'Saving for retirement' })
            result.current.updateData({ age: 25, annualIncome: '50k-75k', country: 'US' })
            result.current.updateData({ investmentAmount: '5k-10k', riskTolerance: 'Moderate' })
            // Move to last step
            for (let i = 1; i < 5; i++) {
                result.current.handleNext()
            }
        })
        await act(async () => {
            await result.current.handleComplete()
        })
        await waitFor(() => {
            expect(usersApi.updateFinancialProfile).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('handles completion errors', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
        vi.mocked(usersApi.updateFinancialProfile).mockRejectedValue(new Error('API Error'))
        const { result } = renderHook(() => useOnboarding())
        await act(async () => {
            await result.current.handleComplete()
        })
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(alertSpy).toHaveBeenCalled()
        })
        consoleErrorSpy.mockRestore()
        alertSpy.mockRestore()
    })

    it('calculates canProceed correctly', () => {
        const { result } = renderHook(() => useOnboarding())
        expect(result.current.canProceed).toBe(true) // Step 1 with default financialGoals
        act(() => {
            result.current.updateData({ financialGoals: '' })
        })
        expect(result.current.canProceed).toBe(false)
    })

    it('identifies first and last steps correctly', () => {
        const { result } = renderHook(() => useOnboarding())
        expect(result.current.isFirstStep).toBe(true)
        expect(result.current.isLastStep).toBe(false)
        act(() => {
            for (let i = 1; i < 5; i++) {
                result.current.handleNext()
            }
        })
        expect(result.current.isFirstStep).toBe(false)
        expect(result.current.isLastStep).toBe(true)
    })
})

