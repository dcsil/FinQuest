import { describe, it, expect } from 'vitest'
import { formatExperience, formatIncome, formatInvestmentAmount } from '@/features/profile/utils/formatters'

describe('Profile Formatters', () => {
    describe('formatExperience', () => {
        it('formats 0 years correctly', () => {
            expect(formatExperience(0)).toBe('Less than 1 year')
        })

        it('formats 1 year correctly', () => {
            expect(formatExperience(1)).toBe('1 year')
        })

        it('formats multiple years correctly', () => {
            expect(formatExperience(2)).toBe('2 years')
            expect(formatExperience(5)).toBe('5 years')
            expect(formatExperience(10)).toBe('10 years')
        })

        it('returns undefined for null/undefined', () => {
            expect(formatExperience(undefined)).toBeUndefined()
            expect(formatExperience(null as any)).toBeUndefined()
        })
    })

    describe('formatIncome', () => {
        it('formats income ranges correctly', () => {
            expect(formatIncome('0-25k')).toBe('$0 - $25,000')
            expect(formatIncome('25k-50k')).toBe('$25,000 - $50,000')
            expect(formatIncome('150k+')).toBe('$150,000+')
        })

        it('returns undefined for empty string', () => {
            expect(formatIncome('')).toBeUndefined()
        })

        it('returns undefined for undefined', () => {
            expect(formatIncome(undefined)).toBeUndefined()
        })

        it('returns original value for unknown range', () => {
            expect(formatIncome('unknown')).toBe('unknown')
        })
    })

    describe('formatInvestmentAmount', () => {
        it('formats investment amounts correctly', () => {
            expect(formatInvestmentAmount('0-1k')).toBe('$0 - $1,000')
            expect(formatInvestmentAmount('1k-5k')).toBe('$1,000 - $5,000')
            expect(formatInvestmentAmount('25k+')).toBe('$25,000+')
        })

        it('returns undefined for empty string', () => {
            expect(formatInvestmentAmount('')).toBeUndefined()
        })

        it('returns undefined for undefined', () => {
            expect(formatInvestmentAmount(undefined)).toBeUndefined()
        })

        it('returns original value for unknown amount', () => {
            expect(formatInvestmentAmount('unknown')).toBe('unknown')
        })
    })
})

