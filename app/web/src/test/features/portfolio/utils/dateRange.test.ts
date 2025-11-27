import { describe, it, expect } from 'vitest'
import { getDateRange } from '@/features/portfolio/utils/dateRange'
import { subDays, startOfYear } from 'date-fns'

describe('getDateRange', () => {
    it('returns correct range for 1d', () => {
        const result = getDateRange('1d')
        expect(result.granularity).toBe('hourly')
        expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns correct range for 1w', () => {
        const result = getDateRange('1w')
        expect(result.granularity).toBe('6hourly')
    })

    it('returns correct range for 1m', () => {
        const result = getDateRange('1m')
        expect(result.granularity).toBe('daily')
    })

    it('returns correct range for ytd', () => {
        const result = getDateRange('ytd')
        expect(result.granularity).toBe('daily')
        const expectedFrom = startOfYear(new Date())
        expect(result.from).toBe(expectedFrom.toISOString().split('T')[0])
    })

    it('returns correct range for 1y', () => {
        const result = getDateRange('1y')
        expect(result.granularity).toBe('weekly')
    })

    it('returns default range for invalid input', () => {
        const result = getDateRange('invalid' as any)
        expect(result.granularity).toBe('daily')
    })

    it('returns dates in correct format', () => {
        const result = getDateRange('1m')
        expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})

