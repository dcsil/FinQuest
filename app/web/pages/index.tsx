import Head from "next/head";
import Image from "next/image";
import {
    AppShell,
    Button,
    Container,
    Group,
    Text,
    Title,
    Stack,
    useMantineColorScheme,
    ActionIcon,
    Box,
} from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import FinQuestLogo from "../assets/FinQuestLogo.png";
import GradientBackground from "@/components/GradientBackground";

const ColorSchemeToggle = () => {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <ActionIcon
            variant="subtle"
            onClick={() => setColorScheme(isDark ? "light" : "dark")}
            aria-label="Toggle color scheme"
        >
            {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
    );
};

export default function Home() {
    return (
        <>
            <Head>
                <title>FinQuest - Unlock Your Investing Potential</title>
                <meta
                    name="description"
                    content="AI-powered insights and education designed for the next generation of investors"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <AppShell
                header={{ height: 70 }}
                padding={0}
                styles={{
                    main: {
                        height: "100vh",
                        overflow: "hidden",
                        position: "relative",
                    },
                }}
            >
                <AppShell.Header>
                    <Container size="xl" h="100%">
                        <Group justify="space-between" h="100%">
                            <Group gap="xs">
                                <Image
                                    src={FinQuestLogo}
                                    alt="FinQuest Logo"
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: "8px" }}
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
                            <Group gap="md">
                                <ColorSchemeToggle />
                                <Button variant="filled">
                                    Sign Up
                                </Button>
                            </Group>
                        </Group>
                    </Container>
                </AppShell.Header>

                <AppShell.Main>
                    <GradientBackground />
                    <Box
                        style={{
                            height: "calc(100vh - 70px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        <Container size="md">
                            <Stack align="center" gap="xl">
                                <Stack align="center" gap="md">
                                    <Title
                                        order={1}
                                        size={56}
                                        fw={800}
                                        ta="center"
                                        style={{
                                            lineHeight: 1.2,
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        Unlock Your Investing Potential
                                    </Title>
                                    <Text
                                        size="xl"
                                        ta="center"
                                        maw={800}
                                        style={{ lineHeight: 1.6 }}
                                    >
                                        AI-powered insights and education designed for the next
                                        generation of investors. Start your journey to financial
                                        literacy today
                                    </Text>
                                </Stack>
                                <Button size="xl" variant="filled" mt={10} radius="lg">
                                    Get Started for Free
                                </Button>
                            </Stack>
                        </Container>
                    </Box>
                </AppShell.Main>
            </AppShell>
        </>
    );
}
