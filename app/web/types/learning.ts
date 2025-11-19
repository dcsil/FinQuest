export interface Suggestion {
    id: string;
    reason: string;
    confidence: number | null;
    moduleId: string | null;
    status: string;
    metadata: {
        type: string;
        topic: string;
    } | null;
}

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

export interface ModuleAttemptResponse {
    status: string;
    attempt_id: string;
    completed: boolean;
}
