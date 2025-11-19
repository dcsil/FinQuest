export interface UserProfile {
    financialGoals?: string;
    investingExperience?: number;
    age?: number;
    annualIncome?: string;
    investmentAmount?: string;
    riskTolerance?: string;
}

export interface UpdateProfileRequest extends UserProfile {}

export interface UpdateProfileResponse {
    status: string;
    message: string;
    id: string;
}
