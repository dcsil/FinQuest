import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '../../../test-utils'
import { useSnapshots } from '@/features/portfolio/hooks/useSnapshots'
import { portfolioApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
    portfolioApi: {
        getSnapshots: vi.fn(),
    },
}))

describe('useSnapshots', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with empty snapshots', () => {
        const { result } = renderHook(() => useSnapshots())
        expect(result.current.snapshots).toEqual([])
        expect(result.current.showSkeleton).toBe(false)
        expect(result.current.timeRange).toBe('1m')
    })

    it('loads snapshots successfully', async () => {
        const mockSnapshots = [
            { asOf: '2024-01-01T00:00:00Z', totalValue: 10000 },
        ]
        vi.mocked(portfolioApi.getSnapshots).mockResolvedValue({ series: mockSnapshots } as unknown as Awaited<ReturnType<typeof portfolioApi.getSnapshots>>)
        const { result } = renderHook(() => useSnapshots())
        await act(async () => {
            await result.current.loadSnapshots()
        })
        await waitFor(() => {
            expect(result.current.snapshots).toEqual(mockSnapshots)
            expect(result.current.showSkeleton).toBe(false)
        }, { timeout: 3000 })
    })

    it('handles loading errors', async () => {
        vi.mocked(portfolioApi.getSnapshots).mockRejectedValue(new Error('Error'))
        const { result } = renderHook(() => useSnapshots())
        await act(async () => {
            await result.current.loadSnapshots()
        })
        await waitFor(() => {
            expect(result.current.showSkeleton).toBe(false)
        }, { timeout: 3000 })
    })

    it('updates time range', () => {
        const { result } = renderHook(() => useSnapshots())
        act(() => {
            result.current.setTimeRange('1w')
        })
        expect(result.current.timeRange).toBe('1w')
    })

    it('uses custom initial range', () => {
        const { result } = renderHook(() => useSnapshots('1y'))
        expect(result.current.timeRange).toBe('1y')
    })
})

