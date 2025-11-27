import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, formatQuantity } from '@/features/portfolio/utils/formatters'

describe('Portfolio Formatters', () => {
    describe('formatCurrency', () => {
        it('formats number correctly', () => {
            expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
            expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
        })

        it('formats string number correctly', () => {
            expect(formatCurrency('1000', 'USD')).toBe('$1,000.00')
            expect(formatCurrency('1234.56', 'USD')).toBe('$1,234.56')
        })

        it('handles null and undefined', () => {
            expect(formatCurrency(null, 'USD')).toBe('~')
            expect(formatCurrency(undefined, 'USD')).toBe('~')
        })

        it('handles invalid values', () => {
            expect(formatCurrency('invalid', 'USD')).toBe('~')
            expect(formatCurrency(NaN, 'USD')).toBe('~')
        })

        it('uses provided currency', () => {
            expect(formatCurrency(1000, 'EUR')).toContain('€')
            expect(formatCurrency(1000, 'GBP')).toContain('£')
        })
    })

    describe('formatPercentage', () => {
        it('formats positive percentage correctly', () => {
            expect(formatPercentage(5.5)).toBe('+5.50%')
            expect(formatPercentage(10)).toBe('+10.00%')
        })

        it('formats negative percentage correctly', () => {
            expect(formatPercentage(-5.5)).toBe('-5.50%')
            expect(formatPercentage(-10)).toBe('-10.00%')
        })

        it('formats string number correctly', () => {
            expect(formatPercentage('5.5')).toBe('+5.50%')
            expect(formatPercentage('-5.5')).toBe('-5.50%')
        })

        it('handles null and undefined', () => {
            expect(formatPercentage(null)).toBe('~')
            expect(formatPercentage(undefined)).toBe('~')
        })

        it('handles zero', () => {
            expect(formatPercentage(0)).toBe('+0.00%')
        })
    })

    describe('formatQuantity', () => {
        it('formats number correctly', () => {
            expect(formatQuantity(10)).toBe('10.0000')
            expect(formatQuantity(10.1234)).toBe('10.1234')
            expect(formatQuantity(10.12345678)).toBe('10.1235')
        })

        it('formats string number correctly', () => {
            expect(formatQuantity('10')).toBe('10.0000')
            expect(formatQuantity('10.1234')).toBe('10.1234')
        })

        it('handles null and undefined', () => {
            expect(formatQuantity(null)).toBe('~')
            expect(formatQuantity(undefined)).toBe('~')
        })

        it('handles invalid values', () => {
            expect(formatQuantity('invalid')).toBe('~')
            expect(formatQuantity(NaN)).toBe('~')
        })
    })
})

