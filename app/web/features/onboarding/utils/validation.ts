import type { OnboardingData } from '../types';
import { TOTAL_STEPS } from '../constants';

export const validateStep = (step: number, data: OnboardingData): boolean => {
    switch (step) {
        case 1:
            return !!data.financialGoals;
        case 2:
            return !!data.age && !!data.annualIncome && !!data.country;
        case 3:
            return !!data.investmentAmount && !!data.riskTolerance;
        case 4:
            return true; // Step 4 is informational
        case 5:
            return true; // Step 5 is review
        default:
            return false;
    }
};

export const canProceedToNextStep = (currentStep: number, data: OnboardingData): boolean => {
    if (currentStep >= TOTAL_STEPS) {
        return false;
    }
    return validateStep(currentStep, data);
};

export const getExperienceLabel = (experience: number): string => {
    switch (experience) {
        case 0:
            return "Not at all";
        case 1:
            return "Beginner";
        case 2:
            return "Intermediate";
        case 3:
            return "Advanced";
        case 4:
            return "Expert";
        default:
            return "Beginner";
    }
};


