import { useMantineColorScheme, Box } from "@mantine/core";

const GradientBackground = () => {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <Box
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                overflow: "hidden",
                background: isDark
                    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
                    : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)",
            }}
        >
            {/* Radial gradient orbs */}
            <Box
                style={{
                    position: "absolute",
                    top: "-10%",
                    right: "-5%",
                    width: "600px",
                    height: "600px",
                    borderRadius: "50%",
                    background: isDark
                        ? "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)"
                        : "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%)",
                    filter: "blur(40px)",
                }}
            />
            <Box
                style={{
                    position: "absolute",
                    bottom: "-10%",
                    left: "-5%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: isDark
                        ? "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)"
                        : "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%)",
                    filter: "blur(40px)",
                }}
            />
            <Box
                style={{
                    position: "absolute",
                    top: "40%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px",
                    height: "400px",
                    borderRadius: "50%",
                    background: isDark
                        ? "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%)"
                        : "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)",
                    filter: "blur(60px)",
                }}
            />
            {/* Grid pattern overlay */}
            <Box
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: isDark
                        ? "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)"
                        : "linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                    opacity: 0.5,
                }}
            />
        </Box>
    );
};

export default GradientBackground;