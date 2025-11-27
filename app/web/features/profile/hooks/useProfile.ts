import { useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import type { UserProfile } from '@/types/user';

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await usersApi.getFinancialProfile();
            setProfile(data);
            return data;
        } catch (err) {
            console.error('Failed to load profile:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!profile) return;
        try {
            const updatedProfile = { ...profile, ...updates };
            await usersApi.updateFinancialProfile(updatedProfile);
            setProfile(updatedProfile);
            return updatedProfile;
        } catch (err) {
            console.error('Failed to update profile:', err);
            throw err;
        }
    }, [profile]);

    return {
        profile,
        loading,
        loadProfile,
        updateProfile,
    };
};

