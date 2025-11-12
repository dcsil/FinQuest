/**
 * Allocation Chart Component
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationChartProps {
    data: Record<string, number>;
    title: string;
    colors?: string[];
}

const DEFAULT_COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#8dd1e1',
    '#d084d0',
];

export const AllocationChart = ({ data, title, colors = DEFAULT_COLORS }: AllocationChartProps) => {
    const chartData = Object.entries(data).map(([name, value]) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return {
            name,
            value: Number((numValue * 100).toFixed(2)),
        };
    });

    if (chartData.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No allocation data available</p>
            </div>
        );
    }

    return (
        <div>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

