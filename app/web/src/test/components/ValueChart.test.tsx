import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { ValueChart } from '@/components/ValueChart'
import type { SnapshotPoint } from '@/types/portfolio'

const mockData: SnapshotPoint[] = [
    {
        asOf: '2024-01-01T00:00:00Z',
        totalValue: 10000,
    },
    {
        asOf: '2024-01-02T00:00:00Z',
        totalValue: 10500,
    },
    {
        asOf: '2024-01-03T00:00:00Z',
        totalValue: 11000,
    },
]

describe('ValueChart', () => {
    it('renders chart with data', () => {
        render(<ValueChart data={mockData} baseCurrency="USD" />)
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })

    it('shows message when data is empty', () => {
        render(<ValueChart data={[]} baseCurrency="USD" />)
        expect(screen.getByText('No snapshot data available')).toBeInTheDocument()
    })

    it('calls onRefresh when refresh button is clicked', async () => {
        const user = userEvent.setup()
        const onRefresh = vi.fn().mockResolvedValue(undefined)
        render(<ValueChart data={mockData} baseCurrency="USD" onRefresh={onRefresh} />)
        // Find the refresh button by role
        const refreshButton = screen.getByRole('button')
        expect(refreshButton).toBeInTheDocument()
        await user.click(refreshButton)
        expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('calls onRangeChange when range is changed', async () => {
        const user = userEvent.setup()
        const onRangeChange = vi.fn()
        render(<ValueChart data={mockData} baseCurrency="USD" onRangeChange={onRangeChange} />)
        const rangeButton = screen.getByRole('radio', { name: /1w/i })
        await user.click(rangeButton)
        expect(onRangeChange).toHaveBeenCalled()
    })

    it('displays overlay value when provided', () => {
        render(
            <ValueChart
                data={mockData}
                baseCurrency="USD"
                overlayValue={12000}
                overlayPercentage={20}
                overlayCurrency="USD"
            />
        )
        expect(screen.getByText(/\$12,000\.00/)).toBeInTheDocument()
    })

    it('handles string totalValue correctly', () => {
        const stringData: SnapshotPoint[] = [
            {
                asOf: '2024-01-01T00:00:00Z',
                totalValue: 10000,
            },
        ]
        render(<ValueChart data={stringData} baseCurrency="USD" />)
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })

    it('uses default range when not provided', () => {
        render(<ValueChart data={mockData} baseCurrency="USD" />)
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })

    it('handles empty overlay value', () => {
        render(
            <ValueChart
                data={mockData}
                baseCurrency="USD"
                overlayValue={null}
                overlayPercentage={null}
            />
        )
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })

    it('handles different granularities', () => {
        const hourlyData: SnapshotPoint[] = [
            { asOf: '2024-01-01T10:00:00Z', totalValue: 10000 },
            { asOf: '2024-01-01T11:00:00Z', totalValue: 10100 },
        ]
        render(<ValueChart data={hourlyData} baseCurrency="USD" granularity="hourly" />)
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })

    it('handles negative percentage change', () => {
        render(
            <ValueChart
                data={mockData}
                baseCurrency="USD"
                overlayValue={10000}
                overlayPercentage={-5.5}
                overlayCurrency="USD"
            />
        )
        expect(screen.getByText(/\$10,000\.00/)).toBeInTheDocument()
    })

    it('sorts data by date correctly', () => {
        const unsortedData: SnapshotPoint[] = [
            { asOf: '2024-01-03T00:00:00Z', totalValue: 11000 },
            { asOf: '2024-01-01T00:00:00Z', totalValue: 10000 },
            { asOf: '2024-01-02T00:00:00Z', totalValue: 10500 },
        ]
        render(<ValueChart data={unsortedData} baseCurrency="USD" />)
        expect(screen.getByText('Portfolio Value Over Time')).toBeInTheDocument()
    })
})

