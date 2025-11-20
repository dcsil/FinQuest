import Head from "next/head";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
    Container,
    Paper,
    Button,
    Title,
    Text,
    Stack,
    Group,
    Box,
    Progress,
    Radio,
    Slider,
    NumberInput,
    Select,
    useMantineColorScheme,
    rem,
    Menu,
    Avatar,
} from "@mantine/core";
import { IconArrowRight, IconArrowLeft, IconLogout, IconUser } from "@tabler/icons-react";
import FinQuestLogo from "../assets/FinQuestLogo.png";
import GradientBackground from "@/components/GradientBackground";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { usersApi } from "@/lib/api";

interface OnboardingData {
    financialGoals: string;
    investingExperience: number;
    age: number;
    annualIncome: string;
    investmentAmount: string;
    riskTolerance: string;
}

const financialGoalsOptions = [
    "Saving for retirement",
    "Buying a home",
    "Starting a business",
    "Paying off debt",
    "General savings",
];

const incomeRanges = [
    { value: "0-25k", label: "$0 - $25,000" },
    { value: "25k-50k", label: "$25,000 - $50,000" },
    { value: "50k-75k", label: "$50,000 - $75,000" },
    { value: "75k-100k", label: "$75,000 - $100,000" },
    { value: "100k-150k", label: "$100,000 - $150,000" },
    { value: "150k+", label: "$150,000+" },
];

const investmentAmounts = [
    { value: "0-1k", label: "$0 - $1,000" },
    { value: "1k-5k", label: "$1,000 - $5,000" },
    { value: "5k-10k", label: "$5,000 - $10,000" },
    { value: "10k-25k", label: "$10,000 - $25,000" },
    { value: "25k+", label: "$25,000+" },
];

const riskToleranceOptions = [
    "Conservative",
    "Moderately Conservative",
    "Moderate",
    "Moderately Aggressive",
    "Aggressive",
];

const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { colorScheme } = useMantineColorScheme();
    const { user, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const [data, setData] = useState<OnboardingData>({
        financialGoals: "Saving for retirement",
        investingExperience: 1,
        age: 25,
        annualIncome: "",
        investmentAmount: "",
        riskTolerance: "Moderate",
    });

    const totalSteps = 5;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);

        try {
            await usersApi.updateFinancialProfile(data);
            setLoading(false);
            router.push('/dashboard');
        } catch (error) {
            console.error("Onboarding failed:", error);
            setLoading(false);
            alert("Failed to save onboarding data. Please try again.");
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Stack gap="lg">
                        <Title order={2} ta="center">
                            What are your financial goals?
                        </Title>
                        <Radio.Group
                            value={data.financialGoals}
                            onChange={(value) => setData({ ...data, financialGoals: value })}
                        >
                            <Stack gap="sm">
                                {financialGoalsOptions.map((goal) => (
                                    <Radio
                                        key={goal}
                                        value={goal}
                                        label={goal}
                                        size="md"
                                        styles={{
                                            label: { fontSize: rem(16), fontWeight: 500 },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Radio.Group>

                        <Title order={2} ta="center" mt="xl">
                            How familiar are you with investing?
                        </Title>
                        <Stack gap="md">
                            <Slider
                                value={data.investingExperience}
                                onChange={(value) => setData({ ...data, investingExperience: value })}
                                min={0}
                                max={4}
                                step={1}
                                marks={[
                                    { value: 0, label: "Not at all" },
                                    { value: 1, label: "Beginner" },
                                    { value: 2, label: "Intermediate" },
                                    { value: 3, label: "Advanced" },
                                    { value: 4, label: "Expert" },
                                ]}
                                size="lg"
                                color="blue"
                            />
                        </Stack>
                    </Stack>
                );

            case 2:
                return (
                    <Stack gap="lg">
                        <Title order={2} ta="center">
                            Tell us about yourself
                        </Title>

                        <NumberInput
                            label="What's your age?"
                            placeholder="Enter your age"
                            value={data.age}
                            onChange={(value) => setData({ ...data, age: Number(value) || 25 })}
                            min={18}
                            max={100}
                            size="md"
                        />

                        <Select
                            label="What's your annual income?"
                            placeholder="Select your income range"
                            data={incomeRanges}
                            value={data.annualIncome}
                            onChange={(value) => setData({ ...data, annualIncome: value || "" })}
                            size="md"
                            searchable
                        />
                    </Stack>
                );

            case 3:
                return (
                    <Stack gap="lg">
                        <Title order={2} ta="center">
                            Investment Preferences
                        </Title>

                        <Select
                            label="How much do you plan to invest initially?"
                            placeholder="Select investment amount"
                            data={investmentAmounts}
                            value={data.investmentAmount}
                            onChange={(value) => setData({ ...data, investmentAmount: value || "" })}
                            size="md"
                            searchable
                        />

                        <Select
                            label="What's your risk tolerance?"
                            placeholder="Select your risk tolerance"
                            data={riskToleranceOptions}
                            value={data.riskTolerance}
                            onChange={(value) => setData({ ...data, riskTolerance: value || "Moderate" })}
                            size="md"
                            searchable
                        />
                    </Stack>
                );

            case 4:
                return (
                    <Stack gap="lg">
                        <Title order={2} ta="center">
                            Investment Experience
                        </Title>

                        <Text size="lg" ta="center" c="dimmed">
                            Have you invested before?
                        </Text>

                        <Radio.Group
                            value={data.investingExperience > 1 ? "yes" : "no"}
                            onChange={(value) =>
                                setData({
                                    ...data,
                                    investingExperience: value === "yes" ? 3 : 0
                                })
                            }
                        >
                            <Group justify="center" gap="xl">
                                <Radio value="no" label="No, I'm new to investing" size="md" />
                                <Radio value="yes" label="Yes, I have experience" size="md" />
                            </Group>
                        </Radio.Group>

                        <Text size="sm" ta="center" c="dimmed" mt="md">
                            Based on your experience level: {data.investingExperience === 0 ? "Beginner" :
                                data.investingExperience === 1 ? "Beginner" :
                                    data.investingExperience === 2 ? "Intermediate" :
                                        data.investingExperience === 3 ? "Advanced" : "Expert"}
                        </Text>
                    </Stack>
                );

            case 5:
                return (
                    <Stack gap="lg">
                        <Title order={2} ta="center">
                            Review Your Profile
                        </Title>

                        <Paper p="md" withBorder shadow="xs">
                            <Stack gap="sm">
                                <Text><strong>Financial Goal:</strong> {data.financialGoals}</Text>
                                <Text><strong>Investment Experience:</strong> {
                                    data.investingExperience === 0 ? "Not at all" :
                                        data.investingExperience === 1 ? "Beginner" :
                                            data.investingExperience === 2 ? "Intermediate" :
                                                data.investingExperience === 3 ? "Advanced" : "Expert"
                                }</Text>
                                <Text><strong>Age:</strong> {data.age}</Text>
                                <Text><strong>Annual Income:</strong> {data.annualIncome ? incomeRanges.find(r => r.value === data.annualIncome)?.label : "Not specified"}</Text>
                                <Text><strong>Initial Investment:</strong> {data.investmentAmount ? investmentAmounts.find(r => r.value === data.investmentAmount)?.label : "Not specified"}</Text>
                                <Text><strong>Risk Tolerance:</strong> {data.riskTolerance}</Text>
                            </Stack>
                        </Paper>

                        <Text size="sm" ta="center" c="dimmed">
                            Ready to start your investment journey? Click complete to finish setting up your profile.
                        </Text>
                    </Stack>
                );

            default:
                return null;
        }
    };

    return (
        <ProtectedRoute>
            <Head>
                <title>Onboarding - FinQuest</title>
                <meta name="description" content="Complete your FinQuest profile setup" />
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
                    padding: rem(20),
                }}
            >
                <GradientBackground />
                <Container size="sm" style={{ position: "relative", zIndex: 1 }}>
                    <Paper
                        shadow="xl"
                        radius="lg"
                        miw={600}
                        p="xl"
                        style={{
                            backgroundColor: (mounted && colorScheme === "dark") ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "background-color 0.2s ease",
                        }}
                    >
                        <Stack gap="lg">
                            {/* Header */}
                            <Group justify="space-between" align="center">
                                <Group gap="xs">
                                    <Image
                                        src={FinQuestLogo}
                                        alt="FinQuest Logo"
                                        width={32}
                                        height={32}
                                        style={{ borderRadius: "8px" }}
                                    />
                                    <Text
                                        size="lg"
                                        fw={700}
                                        style={{
                                            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                        }}
                                    >
                                        FinQuest
                                    </Text>
                                </Group>
                                <Group gap="sm">
                                    <Text size="sm" c="dimmed">
                                        Step {currentStep} of {totalSteps}
                                    </Text>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <Avatar
                                                radius="xl"
                                                size="sm"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Label>
                                                {user?.email}
                                            </Menu.Label>
                                            <Menu.Divider />
                                            <Menu.Item
                                                leftSection={<IconUser size={14} />}
                                                onClick={() => alert('Profile coming soon!')}
                                            >
                                                Profile
                                            </Menu.Item>
                                            <Menu.Item
                                                color="red"
                                                leftSection={<IconLogout size={14} />}
                                                onClick={signOut}
                                            >
                                                Sign out
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Group>

                            {/* Progress Bar */}
                            <Progress
                                value={(currentStep / totalSteps) * 100}
                                size="sm"
                                radius="xl"
                                color="blue"
                            />

                            {/* Step Content */}
                            <Box style={{ minHeight: rem(400) }}>
                                {renderStep()}
                            </Box>

                            {/* Navigation */}
                            <Group justify="space-between" mt="xl">
                                <Button
                                    variant="outline"
                                    leftSection={<IconArrowLeft size={16} />}
                                    onClick={handlePrevious}
                                    disabled={currentStep === 1}
                                >
                                    Previous
                                </Button>

                                <Button
                                    rightSection={currentStep < totalSteps ? <IconArrowRight size={16} /> : null}
                                    onClick={handleNext}
                                    loading={loading && currentStep === totalSteps}
                                    disabled={
                                        (currentStep === 1 && !data.financialGoals) ||
                                        (currentStep === 2 && (!data.age || !data.annualIncome)) ||
                                        (currentStep === 3 && (!data.investmentAmount || !data.riskTolerance))
                                    }
                                >
                                    {currentStep < totalSteps ? "Next" : "Complete"}
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Container>
            </Box>
        </ProtectedRoute>
    );
};

export default Onboarding;
