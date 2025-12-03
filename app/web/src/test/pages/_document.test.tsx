import { describe, it, expect, vi } from 'vitest'
import { render } from '../test-utils'
import Document from '@/pages/_document'

// Mock Next.js document components
vi.mock('next/document', () => ({
    Html: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <html {...props} data-testid="html">{children}</html>
    ),
    Head: ({ children }: { children: React.ReactNode }) => (
        <head data-testid="head">{children}</head>
    ),
    Main: () => <main data-testid="main" />,
    NextScript: () => <script data-testid="next-script" />,
}))

// Mock Mantine ColorSchemeScript
vi.mock('@mantine/core', async () => {
    const actual = await vi.importActual('@mantine/core')
    return {
        ...actual,
        ColorSchemeScript: () => <script data-testid="color-scheme-script" />,
        mantineHtmlProps: {},
    }
})

describe('_document.tsx', () => {
    it('renders Document component with correct structure', () => {
        render(<Document />)
        
        expect(document.querySelector('[data-testid="html"]')).toBeInTheDocument()
        expect(document.querySelector('[data-testid="head"]')).toBeInTheDocument()
        expect(document.querySelector('[data-testid="main"]')).toBeInTheDocument()
        expect(document.querySelector('[data-testid="next-script"]')).toBeInTheDocument()
    })

    it('includes ColorSchemeScript in head', () => {
        render(<Document />)
        
        const head = document.querySelector('[data-testid="head"]')
        expect(head?.querySelector('[data-testid="color-scheme-script"]')).toBeInTheDocument()
    })

    it('sets lang attribute on html', () => {
        render(<Document />)
        
        const html = document.querySelector('[data-testid="html"]')
        expect(html).toHaveAttribute('lang', 'en')
    })

    it('renders Main and NextScript in body', () => {
        render(<Document />)
        
        expect(document.querySelector('[data-testid="main"]')).toBeInTheDocument()
        expect(document.querySelector('[data-testid="next-script"]')).toBeInTheDocument()
    })
})

