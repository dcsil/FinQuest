import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../../../test-utils'
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio'
import { portfolioApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
    portfolioApi: {
        getPortfolio: vi.fn(),
    },
}))

describe('usePortfolio', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with null portfolio and loading true', () => {
        const { result } = renderHook(() => usePortfolio())
        expect(result.current.portfolio).toBeNull()
        expect(result.current.loading).toBe(true)
        expect(result.current.error).toBeNull()
    })

    it('loads portfolio successfully', async () => {
        const mockPortfolio = {
            holdings: [],
            totals: { totalValue: 10000, totalCostBasis: 9000, unrealizedPL: 1000, dailyPL: 100 },
            baseCurrency: 'USD',
        }
        vi.mocked(portfolioApi.getPortfolio).mockResolvedValue(mockPortfolio as any)
        const { result } = renderHook(() => usePortfolio())
        await result.current.loadPortfolio()
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })
        expect(result.current.portfolio).toEqual(mockPortfolio)
        expect(result.current.error).toBeNull()
    })

    it('handles loading errors', async () => {
        const errorMessage = 'Failed to load portfolio'
        vi.mocked(portfolioApi.getPortfolio).mockRejectedValue(new Error(errorMessage))
        const { result } = renderHook(() => usePortfolio())
        await result.current.loadPortfolio()
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.portfolio).toBeNull()
    })

    it('sets loading to false after error', async () => {
        vi.mocked(portfolioApi.getPortfolio).mockRejectedValue(new Error('Error'))
        const { result } = renderHook(() => usePortfolio())
        await result.current.loadPortfolio()
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })
    })
})

