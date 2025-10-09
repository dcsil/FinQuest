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
} from "@mantine/core";
import { IconMail, IconLock } from "@tabler/icons-react";
import FinQuestLogo from "../assets/FinQuestLogo.png";
import GradientBackground from "@/components/GradientBackground";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock login - just simulate API call
        setTimeout(() => {
            console.log("Login attempt:", { email, password });
            setLoading(false);
            // In real app, redirect to dashboard or onboarding
            alert("Login successful! (Mock)");
        }, 1000);
    };

    return (
        <>
            <Head>
                <title>Login - FinQuest</title>
                <meta name="description" content="Sign in to your FinQuest account" />
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
                                    Welcome back
                                </Title>
                                <Text c="dimmed" ta="center" size="sm">
                                    Sign in to your account to continue
                                </Text>
                            </Stack>

                            <form onSubmit={handleLogin} style={{ width: "100%" }}>
                                <Stack gap="md">
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
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftSection={<IconLock size={16} />}
                                        required
                                    />

                                    <Group justify="space-between" mt="md">
                                        <Anchor
                                            href="#"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                alert("Forgot password clicked (Mock)");
                                            }}
                                        >
                                            Forgot password?
                                        </Anchor>
                                    </Group>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="md"
                                        loading={loading}
                                        mt="md"
                                    >
                                        Sign in
                                    </Button>
                                </Stack>
                            </form>

                            <Divider label="or" labelPosition="center" my="md" style={{ width: "100%" }} />

                            <Button
                                variant="outline"
                                fullWidth
                                size="md"
                                onClick={() => alert("Google login clicked (Mock)")}
                            >
                                Continue with Google
                            </Button>

                            <Text size="sm" ta="center" mt="md">
                                Don&apos;t have an account?{" "}
                                <Anchor
                                    href="/signup"
                                    fw={500}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert("Sign up clicked (Mock)");
                                    }}
                                >
                                    Sign up
                                </Anchor>
                            </Text>
                        </Stack>
                    </Paper>
                </Container>
            </Box>
        </>
    );
}
