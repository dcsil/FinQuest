import { useState } from "react";
import {
    TextInput,
    PasswordInput,
    Button,
    Stack,
    Alert,
} from "@mantine/core";
import { IconMail, IconLock, IconAlertCircle, IconUser, IconCircleCheck } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

interface SignUpFormProps {
    onSuccess?: () => void;
}

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    const validateForm = (): string | null => {
        // Validate passwords match
        if (password !== confirmPassword) {
            return "Passwords do not match";
        }

        // Validate password length
        if (password.length < 6) {
            return "Password must be at least 6 characters long";
        }

        return null;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate form
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
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
            // Redirect to onboarding after a delay
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/onboarding');
                }
            }, 2000);
        }
    };

    return (
        <>
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
                        data-testid="signup-fullname-input"
                    />

                    <TextInput
                        label="Email address"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftSection={<IconMail size={16} />}
                        required
                        type="email"
                        data-testid="signup-email-input"
                    />

                    <PasswordInput
                        label="Password"
                        placeholder="Create a password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftSection={<IconLock size={16} />}
                        required
                        data-testid="signup-password-input"
                    />

                    <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        leftSection={<IconLock size={16} />}
                        required
                        data-testid="signup-confirm-password-input"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        size="md"
                        loading={loading}
                        mt="md"
                        disabled={success}
                        data-testid="signup-submit-button"
                    >
                        Create Account
                    </Button>
                </Stack>
            </form>
        </>
    );
};


