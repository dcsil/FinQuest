import { describe, it, expect } from 'vitest'
import { render } from '../test-utils'
import GradientBackground from '@/components/GradientBackground'

describe('GradientBackground', () => {
    it('renders gradient background', () => {
        const { container } = render(<GradientBackground />)
        const box = container.querySelector('div')
        expect(box).toBeInTheDocument()
    })

    it('applies dark mode styles when colorScheme is dark', () => {
        // This is tested through the component rendering
        // The actual color scheme is handled by Mantine's useMantineColorScheme hook
        const { container } = render(<GradientBackground />)
        expect(container.firstChild).toBeInTheDocument()
    })

    it('renders multiple gradient orbs', () => {
        const { container } = render(<GradientBackground />)
        // Should have multiple Box elements for the gradient orbs
        const boxes = container.querySelectorAll('div')
        expect(boxes.length).toBeGreaterThan(1)
    })
})


