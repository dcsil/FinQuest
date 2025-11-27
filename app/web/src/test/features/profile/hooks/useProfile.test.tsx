import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '../../../test-utils'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { usersApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
    usersApi: {
        getFinancialProfile: vi.fn(),
        updateFinancialProfile: vi.fn(),
    },
}))

describe('useProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with null profile and loading true', () => {
        const { result } = renderHook(() => useProfile())
        expect(result.current.profile).toBeNull()
        expect(result.current.loading).toBe(true)
    })

    it('loads profile successfully', async () => {
        const mockProfile = {
            financialGoals: 'Retirement',
            age: 25,
            riskTolerance: 'Moderate',
        }
        vi.mocked(usersApi.getFinancialProfile).mockResolvedValue(mockProfile as any)
        const { result } = renderHook(() => useProfile())
        await result.current.loadProfile()
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })
        expect(result.current.profile).toEqual(mockProfile)
    })

    it('handles loading errors', async () => {
        vi.mocked(usersApi.getFinancialProfile).mockRejectedValue(new Error('Error'))
        const { result } = renderHook(() => useProfile())
        await expect(result.current.loadProfile()).rejects.toThrow('Error')
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })
    })

    it('updates profile successfully', async () => {
        const initialProfile = { age: 25, riskTolerance: 'Moderate' }
        vi.mocked(usersApi.getFinancialProfile).mockResolvedValue(initialProfile as any)
        vi.mocked(usersApi.updateFinancialProfile).mockResolvedValue({ success: true } as any)
        const { result } = renderHook(() => useProfile())
        await result.current.loadProfile()
        await waitFor(() => {
            expect(result.current.profile).toEqual(initialProfile)
        })
        await act(async () => {
            await result.current.updateProfile({ age: 30 })
        })
        await waitFor(() => {
            expect(result.current.profile?.age).toBe(30)
        })
        expect(usersApi.updateFinancialProfile).toHaveBeenCalledWith({
            ...initialProfile,
            age: 30,
        })
    })

    it('handles update errors', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const mockProfile = { age: 25 }
        vi.mocked(usersApi.getFinancialProfile).mockResolvedValue(mockProfile as any)
        vi.mocked(usersApi.updateFinancialProfile).mockRejectedValue(new Error('Update Error'))
        const { result } = renderHook(() => useProfile())
        await result.current.loadProfile()
        await act(async () => {
            try {
                await result.current.updateProfile({ age: 30 })
            } catch (err) {
                // Expected to throw
            }
        })
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled()
        })
        // Profile should not be updated on error
        expect(result.current.profile?.age).toBe(25)
        consoleErrorSpy.mockRestore()
    })

    it('does not update when profile is null', async () => {
        const { result } = renderHook(() => useProfile())
        await result.current.updateProfile({ age: 30 })
        expect(usersApi.updateFinancialProfile).not.toHaveBeenCalled()
    })
})

