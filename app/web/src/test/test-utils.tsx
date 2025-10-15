import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'

// Mock Next.js router
const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    reload: vi.fn(),
    beforePopState: vi.fn(),
    events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
    isPreview: false,
    basePath: '',
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
}

// Mock useRouter hook
vi.mock('next/router', () => ({
    useRouter: () => mockRouter,
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(),
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
            signInWithPassword: vi.fn(),
            signInWithOAuth: vi.fn(),
        },
    },
}))

// Custom render function that includes Mantine provider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MantineProvider>
            {children}
        </MantineProvider>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Export mock router for tests that need to interact with it
export { mockRouter }
