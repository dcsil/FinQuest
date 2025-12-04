import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import {
    Container,
    Paper,
    Button,
    Title,
    Text,
    Stack,
    Group,
    Divider,
    Box,
    Anchor,
    Alert,
} from "@mantine/core";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";
import FinQuestLogo from "../assets/FinQuestLogo.png";
import GradientBackground from "@/components/GradientBackground";
import { SignUpForm } from "@/components/SignUpForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const SignUp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError(null);

        const { error } = await signInWithGoogle();

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up - FinQuest</title>
                <meta name="description" content="Create your FinQuest account" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Box
                style={{
                    minHeight: "100vh",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <GradientBackground />
                <Container size="xl" miw={600} style={{ position: "relative", zIndex: 1 }}>
                    <Paper
                        shadow="xl"
                        radius="lg"
                        p="xl"
                    >
                        <Stack align="center" gap="lg">
                            <Group gap="xs">
                                <Image
                                    src={FinQuestLogo}
                                    alt="FinQuest Logo"
                                    width={48}
                                    height={48}
                                    style={{ borderRadius: "12px" }}
                                />
                                <Text
                                    size="xl"
                                    fw={700}
                                    style={{
                                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                    }}
                                >
                                    FinQuest
                                </Text>
                            </Group>

                            <Stack gap="xs" align="center">
                                <Title order={2} ta="center">
                                    Create your account
                                </Title>
                                <Text c="dimmed" ta="center" size="sm">
                                    Start your financial journey today
                                </Text>
                            </Stack>

                            <SignUpForm onSuccess={() => router.push('/onboarding')} />

                            {error && (
                                <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" style={{ width: "100%" }}>
                                    {error}
                                </Alert>
                            )}

                            <Divider label="or" labelPosition="center" my="md" style={{ width: "100%" }} />

                            <Button
                                variant="outline"
                                fullWidth
                                size="md"
                                leftSection={<IconBrandGoogle size={18} />}
                                onClick={handleGoogleSignUp}
                                loading={loading}
                            >
                                Sign up with Google
                            </Button>

                            <Text size="sm" ta="center" mt="md">
                                Already have an account?{" "}
                                <Anchor
                                    href="/login"
                                    fw={500}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push('/login');
                                    }}
                                >
                                    Sign in
                                </Anchor>
                            </Text>
                        </Stack>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default SignUp;

