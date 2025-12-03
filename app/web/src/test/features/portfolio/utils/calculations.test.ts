import { describe, it, expect } from 'vitest'
import { calculateUnrealizedPLPercent, calculateDailyPLPercent } from '@/features/portfolio/utils/calculations'

describe('Portfolio Calculations', () => {
    describe('calculateUnrealizedPLPercent', () => {
        it('calculates percentage correctly', () => {
            const totals = {
                totalValue: 11000,
                totalCostBasis: 10000,
                unrealizedPL: 1000,
                dailyPL: 100,
            }
            expect(calculateUnrealizedPLPercent(totals)).toBe(10)
        })

        it('handles zero cost basis', () => {
            const totals = {
                totalValue: 1000,
                totalCostBasis: 0,
                unrealizedPL: 1000,
                dailyPL: 0,
            }
            expect(calculateUnrealizedPLPercent(totals)).toBe(0)
        })

        it('handles negative unrealized PL', () => {
            const totals = {
                totalValue: 9000,
                totalCostBasis: 10000,
                unrealizedPL: -1000,
                dailyPL: 0,
            }
            expect(calculateUnrealizedPLPercent(totals)).toBe(-10)
        })

        it('handles string values', () => {
            const totals = {
                totalValue: '11000',
                totalCostBasis: '10000',
                unrealizedPL: '1000',
                dailyPL: '100',
            }
            expect(calculateUnrealizedPLPercent(totals)).toBe(10)
        })
    })

    describe('calculateDailyPLPercent', () => {
        it('calculates percentage correctly', () => {
            const totals = {
                totalValue: 10100,
                totalCostBasis: 10000,
                unrealizedPL: 100,
                dailyPL: 100,
            }
            expect(calculateDailyPLPercent(totals)).toBeCloseTo(1, 2)
        })

        it('handles zero previous value', () => {
            const totals = {
                totalValue: 100,
                totalCostBasis: 0,
                unrealizedPL: 100,
                dailyPL: 100,
            }
            expect(calculateDailyPLPercent(totals)).toBe(0)
        })

        it('handles zero daily PL', () => {
            const totals = {
                totalValue: 10000,
                totalCostBasis: 10000,
                unrealizedPL: 0,
                dailyPL: 0,
            }
            expect(calculateDailyPLPercent(totals)).toBe(0)
        })

        it('handles negative daily PL', () => {
            const totals = {
                totalValue: 9900,
                totalCostBasis: 10000,
                unrealizedPL: -100,
                dailyPL: -100,
            }
            expect(calculateDailyPLPercent(totals)).toBeLessThan(0)
        })

        it('handles string values', () => {
            const totals = {
                totalValue: '10100',
                totalCostBasis: '10000',
                unrealizedPL: '100',
                dailyPL: '100',
            }
            expect(calculateDailyPLPercent(totals)).toBeCloseTo(1, 2)
        })
    })
})


