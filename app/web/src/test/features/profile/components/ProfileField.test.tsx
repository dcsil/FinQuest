import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test-utils'
import { ProfileField } from '@/features/profile/components/ProfileField'
import { IconUser } from '@tabler/icons-react'

describe('ProfileField', () => {
    it('renders field with label and value', () => {
        render(<ProfileField label="Test Label" value="Test Value" icon={<IconUser />} />)
        expect(screen.getByText('Test Label')).toBeInTheDocument()
        expect(screen.getByText('Test Value')).toBeInTheDocument()
    })

    it('renders number values as strings', () => {
        render(<ProfileField label="Age" value={25} icon={<IconUser />} />)
        expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('returns null when value is undefined', () => {
        const { container } = render(
            <ProfileField label="Test" value={undefined} icon={<IconUser />} />
        )
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('Test')
    })

    it('returns null when value is null', () => {
        const { container } = render(
            <ProfileField label="Test" value={null as unknown as string | number} icon={<IconUser />} />
        )
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('Test')
    })

    it('returns null when value is empty string', () => {
        const { container } = render(
            <ProfileField label="Test" value="" icon={<IconUser />} />
        )
        const textContent = container.textContent || ''
        expect(textContent).not.toContain('Test')
    })

    it('renders icon', () => {
        const { container } = render(
            <ProfileField label="Test" value="Value" icon={<IconUser />} />
        )
        expect(container.querySelector('svg')).toBeInTheDocument()
    })
})

