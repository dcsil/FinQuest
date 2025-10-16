import '@mantine/core/styles.css';

import type { AppProps } from 'next/app';
import { createTheme, MantineProvider } from '@mantine/core';
import { AuthProvider } from '@/contexts/AuthContext';

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: 'blue',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    defaultRadius: 'md',
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        <MantineProvider theme={theme} defaultColorScheme="light">
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </MantineProvider>
    );
}