import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import {
    Container,
    Paper,
    TextInput,
    PasswordInput,
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
import { IconMail, IconLock, IconBrandGoogle, IconAlertCircle, IconUser, IconCircleCheck } from "@tabler/icons-react";
import FinQuestLogo from "../assets/FinQuestLogo.png";
import GradientBackground from "@/components/GradientBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const SignUp = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        const { error } = await signUp(email, password, fullName);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            // Redirect to onboarding or login after a delay
            setTimeout(() => {
                router.push('/onboarding');
            }, 2000);
        }
    };

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

                            {error && (
                                <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" style={{ width: "100%" }}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert icon={<IconCircleCheck size={16} />} color="green" mb="md" style={{ width: "100%" }}>
                                    Account created successfully! Please check your email to verify your account.
                                </Alert>
                            )}

                            <form onSubmit={handleSignUp} style={{ width: "100%" }}>
                                <Stack gap="md">
                                    <TextInput
                                        label="Full Name"
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        leftSection={<IconUser size={16} />}
                                        required
                                    />

                                    <TextInput
                                        label="Email address"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        leftSection={<IconMail size={16} />}
                                        required
                                        type="email"
                                    />

                                    <PasswordInput
                                        label="Password"
                                        placeholder="Create a password (min. 6 characters)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftSection={<IconLock size={16} />}
                                        required
                                    />

                                    <PasswordInput
                                        label="Confirm Password"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        leftSection={<IconLock size={16} />}
                                        required
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="md"
                                        loading={loading}
                                        mt="md"
                                        disabled={success}
                                    >
                                        Create Account
                                    </Button>
                                </Stack>
                            </form>

                            <Divider label="or" labelPosition="center" my="md" style={{ width: "100%" }} />

                            <Button
                                variant="outline"
                                fullWidth
                                size="md"
                                leftSection={<IconBrandGoogle size={18} />}
                                onClick={handleGoogleSignUp}
                                loading={loading}
                                disabled={success}
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

