import type { User } from '@supabase/supabase-js';

export const getUserDisplayName = (user: User | null | undefined): string => {
    if (user?.user_metadata?.full_name) {
        return user.user_metadata.full_name;
    }
    if (user?.email) {
        return user.email.split('@')[0];
    }
    return 'User';
};

export const getUserInitial = (user: User | null | undefined): string => {
    const name = getUserDisplayName(user);
    return name.charAt(0).toUpperCase();
};


