import { describe, it, expect } from 'vitest'
import {
    financialGoalsOptions,
    incomeRanges,
    investmentAmounts,
    riskToleranceOptions,
    countries,
    TOTAL_STEPS,
} from '@/features/onboarding/constants'

describe('Onboarding Constants', () => {
    it('exports financial goals options', () => {
        expect(financialGoalsOptions).toBeInstanceOf(Array)
        expect(financialGoalsOptions.length).toBeGreaterThan(0)
        expect(financialGoalsOptions).toContain('Saving for retirement')
    })

    it('exports income ranges', () => {
        expect(incomeRanges).toBeInstanceOf(Array)
        expect(incomeRanges.length).toBeGreaterThan(0)
        expect(incomeRanges[0]).toHaveProperty('value')
        expect(incomeRanges[0]).toHaveProperty('label')
    })

    it('exports investment amounts', () => {
        expect(investmentAmounts).toBeInstanceOf(Array)
        expect(investmentAmounts.length).toBeGreaterThan(0)
        expect(investmentAmounts[0]).toHaveProperty('value')
        expect(investmentAmounts[0]).toHaveProperty('label')
    })

    it('exports risk tolerance options', () => {
        expect(riskToleranceOptions).toBeInstanceOf(Array)
        expect(riskToleranceOptions.length).toBeGreaterThan(0)
        expect(riskToleranceOptions).toContain('Moderate')
    })

    it('exports countries list', () => {
        expect(countries).toBeInstanceOf(Array)
        expect(countries.length).toBeGreaterThan(0)
        const usCountry = countries.find(c => c.value === 'US')
        expect(usCountry).toBeDefined()
        expect(usCountry?.label).toBe('United States')
    })

    it('exports total steps constant', () => {
        expect(TOTAL_STEPS).toBe(5)
    })
})


