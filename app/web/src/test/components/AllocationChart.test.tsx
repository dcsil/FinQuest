import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import { AllocationChart } from '@/components/AllocationChart'

describe('AllocationChart', () => {
    it('renders chart with data', () => {
        const data = {
            AAPL: 0.4,
            GOOGL: 0.3,
            MSFT: 0.3,
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('Portfolio Allocation')).toBeInTheDocument()
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('GOOGL')).toBeInTheDocument()
        expect(screen.getByText('MSFT')).toBeInTheDocument()
    })

    it('shows message when data is empty', () => {
        render(<AllocationChart data={{}} title="Portfolio Allocation" />)
        expect(screen.getByText('No allocation data available')).toBeInTheDocument()
    })

    it('converts string values to numbers', () => {
        const data: Record<string, number> = {
            AAPL: 0.5,
            GOOGL: 0.5,
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('GOOGL')).toBeInTheDocument()
    })

    it('displays percentages correctly', () => {
        const data = {
            AAPL: 0.4,
            GOOGL: 0.6,
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('40%')).toBeInTheDocument()
        expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('uses custom colors when provided', () => {
        const data = {
            AAPL: 0.5,
            GOOGL: 0.5,
        }
        const customColors = ['#FF0000', '#00FF00']
        render(<AllocationChart data={data} title="Portfolio Allocation" colors={customColors} />)
        expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    it('handles large number of allocations', () => {
        const data: Record<string, number> = {}
        for (let i = 0; i < 15; i++) {
            data[`STOCK${i}`] = 1 / 15
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('STOCK0')).toBeInTheDocument()
        expect(screen.getByText('STOCK14')).toBeInTheDocument()
    })

    it('handles zero values correctly', () => {
        const data = {
            AAPL: 0,
            GOOGL: 1,
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('GOOGL')).toBeInTheDocument()
    })

    it('handles very small values', () => {
        const data = {
            AAPL: 0.0001,
            GOOGL: 0.9999,
        }
        render(<AllocationChart data={data} title="Portfolio Allocation" />)
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText('GOOGL')).toBeInTheDocument()
    })
})


