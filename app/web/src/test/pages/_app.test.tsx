import { describe, it, expect, vi } from 'vitest'

// Mock all dependencies before importing
vi.mock('@mantine/core', () => ({
    createTheme: vi.fn(() => ({})),
    MantineProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/contexts/GamificationContext', () => ({
    GamificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Import after mocks
import App from '@/pages/_app'
import { render, screen } from '../test-utils'

const MockComponent = () => <div data-testid="test-component">Test Component</div>

describe('_app.tsx', () => {
    it('exports App component', () => {
        expect(App).toBeDefined()
        expect(typeof App).toBe('function')
    })

    it('renders App component with providers', () => {
        const pageProps = {}
        render(<App Component={MockComponent} pageProps={pageProps} />)
        
        expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('passes pageProps to Component', () => {
        const pageProps = { testProp: 'test-value' }
        const TestComponent = (props: { testProp?: string }) => (
            <div data-testid="test-component">{props.testProp}</div>
        )
        
        render(<App Component={TestComponent} pageProps={pageProps} />)
        
        expect(screen.getByText('test-value')).toBeInTheDocument()
    })
})
