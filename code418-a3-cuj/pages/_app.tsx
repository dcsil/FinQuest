import "@/styles/globals.css";
import type { AppProps } from "next/app";
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { AppProvider } from '../context/AppContext';
import AppShellComponent from '../components/AppShell';

const theme = createTheme({
    primaryColor: 'blue',
    colors: {
        blue: [
            '#e7f5ff',
            '#d0ebff',
            '#a5d8ff',
            '#74c0fc',
            '#42a5f5',
            '#339af0',
            '#228be6',
            '#1c7ed6',
            '#1971c2',
            '#1864ab'
        ],
        green: [
            '#f3fff3',
            '#e6ffe6',
            '#ccffcc',
            '#99ff99',
            '#66ff66',
            '#33ff33',
            '#00ff00',
            '#00cc00',
            '#009900',
            '#006600'
        ],
        red: [
            '#fff3f3',
            '#ffe6e6',
            '#ffcccc',
            '#ff9999',
            '#ff6666',
            '#ff3333',
            '#ff0000',
            '#cc0000',
            '#990000',
            '#660000'
        ]
    },
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    headings: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    },
    defaultRadius: 'md',
    shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    }
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        <MantineProvider theme={theme} defaultColorScheme="light">
            <AppProvider>
                <AppShellComponent>
                    <Component {...pageProps} />
                </AppShellComponent>
            </AppProvider>
        </MantineProvider>
    );
}