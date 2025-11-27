import { Card, Text, Button, Badge, Group, ThemeIcon, Stack, Box } from "@mantine/core";
import { IconBook, IconChartBar, IconAlertTriangle, IconArrowRight, IconCheck } from "@tabler/icons-react";
import type { Suggestion } from "@/types/learning";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

interface LearningPathwayProps {
    suggestions: Suggestion[];
}

const getIcon = (type: string | undefined) => {
    switch (type) {
        case "investment":
            return <IconChartBar size={24} />;
        case "warning":
            return <IconAlertTriangle size={24} />;
        default:
            return <IconBook size={24} />;
    }
};

const getColor = (type: string | undefined, isCompleted: boolean) => {
    if (isCompleted) return "gray";
    switch (type) {
        case "investment":
            return "blue";
        case "warning":
            return "orange";
        default:
            return "teal";
    }
};

const getConfidenceLabel = (confidence: number | null) => {
    if (!confidence) return { label: 'Low Match', color: 'gray' };
    if (confidence >= 0.8) return { label: 'High Match', color: 'green' };
    if (confidence >= 0.5) return { label: 'Medium Match', color: 'yellow' };
    return { label: 'Low Match', color: 'gray' };
};

const toTitleCase = (str: string): string => {
    if (!str) return str;

    // Words that should remain lowercase unless they're the first word
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];

    return str
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            // Always capitalize the first word, or capitalize if it's not a small word
            if (index === 0 || !smallWords.includes(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        })
        .join(' ');
};

export const LearningPathway = ({ suggestions }: LearningPathwayProps) => {
    const router = useRouter();
    const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const targetPositionRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);

    // Keep suggestions in their original order to preserve pathway sequence
    const sortedSuggestions = [...suggestions];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // Calculate target position (subtle movement)
                targetPositionRef.current = {
                    x: x * 0.02,
                    y: y * 0.02,
                };
            }
        };

        const animate = () => {
            // Smooth interpolation towards target position
            const currentX = backgroundPosition.x;
            const currentY = backgroundPosition.y;
            const targetX = targetPositionRef.current.x;
            const targetY = targetPositionRef.current.y;

            // Easing factor (0.1 = smooth, higher = faster)
            const easing = 0.1;
            const newX = currentX + (targetX - currentX) * easing;
            const newY = currentY + (targetY - currentY) * easing;

            setBackgroundPosition({ x: newX, y: newY });
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                container.removeEventListener('mousemove', handleMouseMove);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [backgroundPosition.x, backgroundPosition.y]);

    return (
        <Box
            ref={containerRef}
            style={{
                position: 'relative',
                padding: '2rem 0',
                backgroundImage: `
                    linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`,
            }}
        >
            <Stack gap={0} align="center">
                {sortedSuggestions.map((suggestion, index) => {
                    const isCompleted = suggestion.status === "completed";
                    const isLast = index === sortedSuggestions.length - 1;
                    const nextSuggestion = sortedSuggestions[index + 1];
                    const nextIsCompleted = nextSuggestion?.status === "completed";
                    const color = getColor(suggestion.metadata?.type, isCompleted);
                    const icon = getIcon(suggestion.metadata?.type);

                    // Determine line color based on completion status
                    const getLineGradient = () => {
                        if (isCompleted && nextIsCompleted) {
                            return 'linear-gradient(to bottom, #51cf66, #69db7c)'; // Green for completed path
                        } else if (isCompleted && !nextIsCompleted) {
                            return 'linear-gradient(to bottom, #51cf66, #228be6)'; // Transition from completed to active
                        } else if (!isCompleted && nextIsCompleted) {
                            return 'linear-gradient(to bottom, #228be6, #51cf66)'; // Transition from active to completed
                        } else {
                            return 'linear-gradient(to bottom, #228be6, #74c0fc)'; // Active path
                        }
                    };

                    return (
                        <Box key={suggestion.id} style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                            {/* Module Card */}
                            <Card
                                shadow={isCompleted ? "xs" : "md"}
                                padding="lg"
                                radius="md"
                                withBorder
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    opacity: isCompleted ? 0.7 : 1,
                                    cursor: isCompleted ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: isCompleted ? '#f8f9fa' : 'white',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCompleted) {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <Box style={{ position: 'relative', zIndex: 1 }}>
                                    <Stack gap="md">
                                        {/* Header */}
                                        <Group justify="space-between" align="flex-start" style={{ position: 'relative', zIndex: 1 }}>
                                            <Group gap="md">
                                                <ThemeIcon
                                                    color={color}
                                                    variant={isCompleted ? "light" : "filled"}
                                                    size="xl"
                                                    radius="md"
                                                    style={{
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {icon}
                                                    {isCompleted && (
                                                        <ThemeIcon
                                                            size="sm"
                                                            color="green"
                                                            variant="filled"
                                                            radius="xl"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '-4px',
                                                                right: '-4px',
                                                                border: '2px solid white',
                                                            }}
                                                        >
                                                            <IconCheck size={12} />
                                                        </ThemeIcon>
                                                    )}
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600} size="lg" c={isCompleted ? "dimmed" : "dark"}>
                                                        {toTitleCase(suggestion.metadata?.topic || "General Learning")}
                                                    </Text>
                                                    {isCompleted && (
                                                        <Badge color="green" variant="light" size="sm" mt={4}>
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Group>
                                            {!isCompleted && suggestion.confidence && (
                                                <Badge variant="light" color={getConfidenceLabel(suggestion.confidence).color}>
                                                    {getConfidenceLabel(suggestion.confidence).label}
                                                </Badge>
                                            )}
                                        </Group>

                                        {/* Description */}
                                        <Text size="sm" c={isCompleted ? "dimmed" : "dark"} style={{ lineHeight: 1.6 }}>
                                            {suggestion.reason}
                                        </Text>

                                        {/* Action Button */}
                                        {isCompleted ? (
                                            <Button
                                                variant="light"
                                                color="gray"
                                                fullWidth
                                                disabled
                                                leftSection={<IconCheck size={16} />}
                                            >
                                                Module Completed
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="light"
                                                color={color}
                                                fullWidth
                                                rightSection={<IconArrowRight size={14} />}
                                                onClick={() => {
                                                    if (suggestion.moduleId) {
                                                        router.push(`/modules/${suggestion.moduleId}`);
                                                    }
                                                }}
                                            >
                                                Start Module
                                            </Button>
                                        )}
                                    </Stack>
                                </Box>
                            </Card>

                            {/* Connecting line - positioned right after the card */}
                            {!isLast && (
                                <Box
                                    style={{
                                        position: 'relative',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '4px',
                                        height: '80px',
                                        marginTop: 0,
                                        marginBottom: 0,
                                        background: getLineGradient(),
                                        zIndex: 1,
                                        borderRadius: '2px',
                                        boxShadow: isCompleted || nextIsCompleted
                                            ? '0 0 8px rgba(81, 207, 102, 0.3)'
                                            : '0 0 8px rgba(34, 139, 230, 0.3)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

