import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, LoadingOverlay, Alert, Button, Group, AppShell } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { AppNav } from '../../components/AppNav';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ModuleViewer, ModuleContent } from '../../components/ModuleViewer';
import { modulesApi } from '../../lib/api';
import { useGamificationEvents } from '../../hooks/useGamificationEvents';

export default function ModulePage() {
    const router = useRouter();
    const { id } = router.query;
    const [module, setModule] = useState<ModuleContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { triggerModuleCompleted, triggerQuizCompleted } = useGamificationEvents();
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!id) return;

        const fetchModule = async () => {
            try {
                setLoading(true);
                const data = await modulesApi.getModule(id as string);
                setModule(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Failed to load module');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchModule();
    }, [id]);

    const handleModuleComplete = async (score: number, total: number) => {
        if (!module || !id) return;
        
        const percentage = (score / total) * 100;
        const passed = percentage >= 70;
        const moduleId = id as string;

        try {
            await modulesApi.submitAttempt(moduleId, score, total, passed);
            
            // Trigger gamification events
            const isFirstTime = !completedModules.has(moduleId);
            await triggerModuleCompleted(moduleId, isFirstTime);
            setCompletedModules((prev) => new Set(prev).add(moduleId));
            
            await triggerQuizCompleted(percentage);
        } catch (err) {
            console.error("Failed to submit attempt:", err);
        }
    };

    return (
        <ProtectedRoute>
            <AppShell header={{ height: 70 }}>
                <AppNav />
                <AppShell.Main>
                    <Container size="lg" py="xl" pos="relative">
                        <LoadingOverlay visible={loading} />
                        
                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                                {error}
                                <Group mt="md">
                                    <Button variant="outline" color="red" onClick={() => router.push('/learn')}>
                                        Back to Learning
                                    </Button>
                                </Group>
                            </Alert>
                        )}

                        {!loading && !error && module && (
                            <>
                                <Button 
                                    variant="subtle" 
                                    leftSection={<IconArrowLeft size={16} />}
                                    onClick={() => router.push('/learn')}
                                    mb="lg"
                                >
                                    Back to Learning Path
                                </Button>
                                <ModuleViewer content={module} onComplete={handleModuleComplete} />
                            </>
                        )}
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
}
