/**
 * Allocation Chart Component
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationChartProps {
    data: Record<string, number>;
    title: string;
    colors?: string[];
}

const DEFAULT_COLORS = [
    '#0088FE', // Bright blue
    '#00C49F', // Cyan/light blue
    '#8884d8', // Dark grey/purple
    '#FFBB28',
    '#FF8042',
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
                        label={false}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend with 2 columns */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {chartData.map((entry, index) => (
                    <div 
                        key={entry.name}
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <div 
                                style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    borderRadius: '50%', 
                                    backgroundColor: colors[index % colors.length],
                                    flexShrink: 0
                                }} 
                            />
                            <span style={{ textAlign: 'left', fontSize: '14px' }}>{entry.name}</span>
                        </div>
                        <span style={{ textAlign: 'right', fontSize: '14px', fontWeight: 500, minWidth: '50px' }}>
                            {entry.value.toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

