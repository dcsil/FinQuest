import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { usersApi } from '@/lib/api';
import type { OnboardingData } from '../types';
import { TOTAL_STEPS } from '../constants';
import { validateStep } from '../utils/validation';

const initialData: OnboardingData = {
    financialGoals: "Saving for retirement",
    investingExperience: 1,
    age: 25,
    annualIncome: "",
    investmentAmount: "",
    riskTolerance: "Moderate",
    country: "US",
};

export const useOnboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>(initialData);
    const router = useRouter();

    const updateData = useCallback((updates: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleComplete = useCallback(async () => {
        setLoading(true);
        try {
            await usersApi.updateFinancialProfile(data);
            setLoading(false);
            router.push('/dashboard');
        } catch (error) {
            console.error("Onboarding failed:", error);
            setLoading(false);
            alert("Failed to save onboarding data. Please try again.");
        }
    }, [data, router]);

    const canProceed = validateStep(currentStep, data);
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === TOTAL_STEPS;

    return {
        currentStep,
        totalSteps: TOTAL_STEPS,
        data,
        loading,
        updateData,
        handleNext,
        handlePrevious,
        handleComplete,
        canProceed,
        isFirstStep,
        isLastStep,
    };
};

