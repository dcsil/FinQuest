import { useState, useEffect } from "react";
import {
    Paper,
    Title,
    Text,
    Stack,
    Button,
    Group,
    Radio,
    Alert,
    Progress,
    Box,
    ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconX, IconBulb } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

export interface Choice {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    question: string;
    choices: Choice[];
    explanation?: string;
}

export interface ModuleContent {
    id: string;
    title: string;
    body: string;
    questions: Question[];
}

export interface ModuleViewerProps {
    content: ModuleContent;
    onComplete?: (score: number, total: number) => void;
}

export const ModuleViewer = ({ content, onComplete }: ModuleViewerProps) => {
    const [activeTab, setActiveTab] = useState<"learn" | "quiz">("learn");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    
    // Reset selected answer when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setShowResult(false);
    }, [currentQuestion]);

    const handleAnswerSubmit = () => {
        if (!selectedAnswer) return;

        const isCorrect = content.questions[currentQuestion].choices.find(
            (c) => c.text === selectedAnswer
        )?.isCorrect;

        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) {
            setScore(newScore);
        }

        setShowResult(true);
    };

    const handleNextQuestion = () => {
        // Clear selected answer first
        setSelectedAnswer(null);
        setShowResult(false);
        
        if (currentQuestion < content.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setQuizCompleted(true);
            if (onComplete) {
                // We need to pass the final score. 
                // Note: 'score' state might not be updated immediately if we just set it in handleAnswerSubmit
                // But handleNextQuestion is called after the user sees the result and clicks "Next/Finish",
                // so 'score' should be up to date.
                onComplete(score, content.questions.length);
            }
        }
    };

    if (activeTab === "learn") {
        return (
            <Stack gap="xl">
                <Paper p="xl" radius="md" withBorder>
                    <Title order={1} mb="lg">{content.title}</Title>
                    <Box className="markdown-content">
                        <ReactMarkdown
                            components={{
                                h1: (props) => <Title order={2} mt="xl" mb="md" {...props} />,
                                h2: (props) => <Title order={3} mt="lg" mb="sm" {...props} />,
                                p: (props) => <Text size="lg" lh={1.6} mb="md" {...props} />,
                                ul: (props) => <Box component="ul" pl="xl" mb="md" {...props} />,
                                li: ({ children }) => <Box component="li" mb="xs"><Text size="lg" span>{children}</Text></Box>,
                                strong: ({ children }) => <Text span fw={700}>{children}</Text>,
                            }}
                        >
                            {content.body}
                        </ReactMarkdown>
                    </Box>
                </Paper>

                <Group justify="center">
                    <Button
                        size="xl"
                        onClick={() => setActiveTab("quiz")}
                        rightSection={<IconBulb size={20} />}
                    >
                        Take the Quiz
                    </Button>
                </Group>
            </Stack>
        );
    }

    // Quiz View
    if (quizCompleted) {
        const percentage = Math.round((score / content.questions.length) * 100);
        const passed = percentage >= 70;

        return (
            <Paper p="xl" radius="md" withBorder>
                <Stack align="center" gap="lg">
                    <ThemeIcon
                        size={80}
                        radius="xl"
                        color={passed ? "green" : "orange"}
                        variant="light"
                    >
                        {passed ? <IconCheck size={40} /> : <IconX size={40} />}
                    </ThemeIcon>
                    
                    <Title order={2}>{passed ? "Module Completed!" : "Keep Trying!"}</Title>
                    
                    <Text size="xl">
                        You scored {score} out of {content.questions.length} ({percentage}%)
                    </Text>

                    {!passed && (
                        <Text c="dimmed" ta="center" maw={500}>
                            You need 70% to pass this module. Review the material and try again to complete the module.
                        </Text>
                    )}

                    <Group>
                        {!passed && (
                            <Button 
                                size="lg" 
                                variant="outline" 
                                onClick={() => {
                                    setScore(0);
                                    setCurrentQuestion(0);
                                    setQuizCompleted(false);
                                    setSelectedAnswer(null);
                                    setShowResult(false);
                                }}
                            >
                                Retry Quiz
                            </Button>
                        )}
                        <Button size="lg" onClick={() => window.location.href = '/learn'}>
                            Back to Learning Path
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        );
    }

    const question = content.questions[currentQuestion];

    return (
        <Stack gap="lg" maw={800} mx="auto">
            <Group justify="space-between">
                <Title order={3}>Quiz: Question {currentQuestion + 1}/{content.questions.length}</Title>
                <Text fw={500} c="dimmed">Score: {score}</Text>
            </Group>

            <Progress value={((currentQuestion) / content.questions.length) * 100} mb="md" />

            <Paper p="xl" radius="md" withBorder>
                <Stack gap="xl">
                    <Text size="xl" fw={500}>{question.question}</Text>

                    <Radio.Group
                        key={`question-${currentQuestion}`}
                        value={selectedAnswer || ""}
                        onChange={setSelectedAnswer}
                    >
                        <Stack gap="md">
                            {question.choices.map((choice, index) => (
                                <Radio
                                    key={index}
                                    value={choice.text}
                                    label={<Text size="lg">{choice.text}</Text>}
                                    disabled={showResult}
                                    styles={{
                                        root: {
                                            padding: '16px',
                                            border: '1px solid',
                                            borderColor: showResult && choice.isCorrect 
                                                ? 'var(--mantine-color-green-filled)' 
                                                : showResult && selectedAnswer === choice.text && !choice.isCorrect
                                                    ? 'var(--mantine-color-red-filled)'
                                                    : 'var(--mantine-color-gray-3)',
                                            borderRadius: '8px',
                                            backgroundColor: showResult && choice.isCorrect 
                                                ? 'var(--mantine-color-green-light)'
                                                : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                        },
                                        radio: {
                                            marginTop: 0,
                                        },
                                        label: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingLeft: '8px',
                                        }
                                    }}
                                />
                            ))}
                        </Stack>
                    </Radio.Group>

                    {showResult && (
                        <Alert
                            variant="light"
                            color={question.choices.find(c => c.text === selectedAnswer)?.isCorrect ? "green" : "red"}
                            title={question.choices.find(c => c.text === selectedAnswer)?.isCorrect ? "Correct!" : "Incorrect"}
                            icon={question.choices.find(c => c.text === selectedAnswer)?.isCorrect ? <IconCheck /> : <IconX />}
                        >
                            {question.explanation || (question.choices.find(c => c.text === selectedAnswer)?.isCorrect 
                                ? "Great job!" 
                                : "Review the material and try again.")}
                        </Alert>
                    )}

                    {!showResult ? (
                        <Button
                            size="lg"
                            onClick={handleAnswerSubmit}
                            disabled={!selectedAnswer}
                        >
                            Check Answer
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={handleNextQuestion}
                        >
                            {currentQuestion < content.questions.length - 1 ? "Next Question" : "Finish Quiz"}
                        </Button>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
};
