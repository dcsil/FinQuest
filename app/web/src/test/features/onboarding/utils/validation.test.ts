import { describe, it, expect } from 'vitest'
import { validateStep, canProceedToNextStep, getExperienceLabel } from '@/features/onboarding/utils/validation'
import type { OnboardingData } from '@/features/onboarding/types'

const validData: OnboardingData = {
    financialGoals: 'Saving for retirement',
    investingExperience: 2,
    age: 25,
    annualIncome: '50k-75k',
    investmentAmount: '5k-10k',
    riskTolerance: 'Moderate',
    country: 'US',
}

describe('Onboarding Validation', () => {
    describe('validateStep', () => {
        it('validates step 1 requires financialGoals', () => {
            expect(validateStep(1, validData)).toBe(true)
            expect(validateStep(1, { ...validData, financialGoals: '' })).toBe(false)
        })

        it('validates step 2 requires age, annualIncome, and country', () => {
            expect(validateStep(2, validData)).toBe(true)
            expect(validateStep(2, { ...validData, age: 0 })).toBe(false)
            expect(validateStep(2, { ...validData, annualIncome: '' })).toBe(false)
            expect(validateStep(2, { ...validData, country: '' })).toBe(false)
        })

        it('validates step 3 requires investmentAmount and riskTolerance', () => {
            expect(validateStep(3, validData)).toBe(true)
            expect(validateStep(3, { ...validData, investmentAmount: '' })).toBe(false)
            expect(validateStep(3, { ...validData, riskTolerance: '' })).toBe(false)
        })

        it('always validates step 4 and 5', () => {
            expect(validateStep(4, validData)).toBe(true)
            expect(validateStep(5, validData)).toBe(true)
            expect(validateStep(4, { ...validData, financialGoals: '' })).toBe(true)
        })

        it('returns false for invalid step numbers', () => {
            expect(validateStep(0, validData)).toBe(false)
            expect(validateStep(6, validData)).toBe(false)
        })
    })

    describe('canProceedToNextStep', () => {
        it('returns true when step is valid and not last step', () => {
            expect(canProceedToNextStep(1, validData)).toBe(true)
            expect(canProceedToNextStep(2, validData)).toBe(true)
            expect(canProceedToNextStep(3, validData)).toBe(true)
        })

        it('returns false when step is invalid', () => {
            expect(canProceedToNextStep(1, { ...validData, financialGoals: '' })).toBe(false)
        })

        it('returns false when on last step', () => {
            expect(canProceedToNextStep(5, validData)).toBe(false)
        })
    })

    describe('getExperienceLabel', () => {
        it('returns correct label for each experience level', () => {
            expect(getExperienceLabel(0)).toBe('Not at all')
            expect(getExperienceLabel(1)).toBe('Beginner')
            expect(getExperienceLabel(2)).toBe('Intermediate')
            expect(getExperienceLabel(3)).toBe('Advanced')
            expect(getExperienceLabel(4)).toBe('Expert')
        })

        it('returns default label for invalid experience', () => {
            expect(getExperienceLabel(5)).toBe('Beginner')
            expect(getExperienceLabel(-1)).toBe('Beginner')
        })
    })
})

