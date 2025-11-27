export interface UserProfile {
    financialGoals?: string;
    investingExperience?: number;
    age?: number;
    annualIncome?: string;
    investmentAmount?: string;
    riskTolerance?: string;
    country?: string;
}

export type UpdateProfileRequest = UserProfile;

export interface UpdateProfileResponse {
    status: string;
    message: string;
    id: string;
}
