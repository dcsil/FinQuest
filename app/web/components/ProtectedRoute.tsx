import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, Center } from '@mantine/core';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

