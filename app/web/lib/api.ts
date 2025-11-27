/**
 * API client for portfolio endpoints
 */
import { supabase } from './supabase';
import type {
    PostPositionRequest,
    PostPositionResponse,
    PortfolioHoldingsResponse,
    SnapshotsResponse,
} from '@/types/portfolio';
import type {
    UserProfile,
    UpdateProfileRequest,
    UpdateProfileResponse,
} from '@/types/user';
import type {
    Suggestion,
    ModuleContent,
    ModuleAttemptResponse,
} from '@/types/learning';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get authentication token from Supabase session
 */
const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
};

/**
 * Make authenticated API request
 */
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `API error: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Portfolio API client
 */
export const portfolioApi = {
    /**
     * Add a position to the portfolio
     */
    addPosition: async (request: PostPositionRequest): Promise<PostPositionResponse> => {
        return apiRequest<PostPositionResponse>('/api/portfolio/positions', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    /**
     * Get portfolio holdings and analytics
     */
    getPortfolio: async (): Promise<PortfolioHoldingsResponse> => {
        return apiRequest<PortfolioHoldingsResponse>('/api/portfolio');
    },

    /**
     * Get portfolio valuation snapshots
     */
    getSnapshots: async (from?: string, to?: string, granularity?: string): Promise<SnapshotsResponse> => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (granularity) params.append('granularity', granularity);
        
        const query = params.toString();
        const endpoint = `/api/portfolio/snapshots${query ? `?${query}` : ''}`;
        
        return apiRequest<SnapshotsResponse>(endpoint);
    },

    /**
     * Generate a new portfolio snapshot or snapshots for a date range
     */
    generateSnapshot: async (from?: string, to?: string): Promise<{ status: string; message: string; count: number }> => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        
        const query = params.toString();
        const endpoint = `/api/portfolio/snapshots/generate${query ? `?${query}` : ''}`;
        
        return apiRequest<{ status: string; message: string; count: number }>(endpoint, {
            method: 'POST',
        });
    },
};

/**
 * Users API client
 */
export const usersApi = {
    /**
     * Check if user has completed onboarding
     */
    getOnboardingStatus: async (): Promise<{ completed: boolean }> => {
        return apiRequest<{ completed: boolean }>('/api/v1/users/onboarding-status');
    },

    /**
     * Get user's financial profile
     */
    getFinancialProfile: async (): Promise<UserProfile> => {
        return apiRequest<UserProfile>('/api/v1/users/financial-profile');
    },

    /**
     * Update user's financial profile
     */
    updateFinancialProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
        return apiRequest<UpdateProfileResponse>('/api/v1/users/financial-profile', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get personalized suggestions
     */
    getSuggestions: async (): Promise<Suggestion[]> => {
        return apiRequest<Suggestion[]>('/api/v1/users/suggestions');
    },
};

/**
 * Modules API client
 */
export const modulesApi = {
    /**
     * Get full content for a specific module
     */
    getModule: async (moduleId: string): Promise<ModuleContent> => {
        return apiRequest<ModuleContent>(`/api/v1/modules/${moduleId}`);
    },

    /**
     * Submit quiz attempt
     */
    submitAttempt: async (moduleId: string, score: number, maxScore: number, passed: boolean): Promise<ModuleAttemptResponse> => {
        return apiRequest<ModuleAttemptResponse>(`/api/v1/modules/${moduleId}/attempt`, {
            method: 'POST',
            body: JSON.stringify({ score, max_score: maxScore, passed }),
        });
    },
};

/**
 * Gamification types
 */
export interface GamificationEventRequest {
    event_type: 'login' | 'module_completed' | 'quiz_completed' | 'portfolio_position_added' | 'portfolio_position_updated';
    module_id?: string;
    quiz_score?: number;
    quiz_completed_at?: string;
    portfolio_position_id?: string;
    is_first_time_for_module?: boolean;
}

export interface BadgeInfo {
    code: string;
    name: string;
    description: string;
}

export interface GamificationEventResponse {
    total_xp: number;
    level: number;
    current_streak: number;
    xp_gained: number;
    level_up: boolean;
    new_badges: BadgeInfo[];
    xp_to_next_level: number;
}

export interface GamificationStateResponse {
    total_xp: number;
    level: number;
    current_streak: number;
    xp_to_next_level: number;
    badges: BadgeInfo[];
}

export interface BadgeDefinitionResponse {
    code: string;
    name: string;
    description: string;
    category: string;
    is_active: boolean;
    earned: boolean;
}

/**
 * Gamification API client
 */
export const gamificationApi = {
    /**
     * Send a gamification event
     */
    sendEvent: async (event: GamificationEventRequest): Promise<GamificationEventResponse> => {
        return apiRequest<GamificationEventResponse>('/api/gamification/event', {
            method: 'POST',
            body: JSON.stringify(event),
        });
    },

    /**
     * Get current gamification state
     */
    getState: async (): Promise<GamificationStateResponse> => {
        return apiRequest<GamificationStateResponse>('/api/gamification/me');
    },

    /**
     * Get all badges
     */
    getBadges: async (): Promise<BadgeDefinitionResponse[]> => {
        return apiRequest<BadgeDefinitionResponse[]>('/api/gamification/badges');
    },
};

