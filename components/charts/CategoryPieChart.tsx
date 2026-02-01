'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSettings } from '@/context/SettingsContext';

interface CategoryPieChartProps {
  data: any[];
}

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { currencySymbol } = useSettings();

  // Safety check to prevent crash if data is empty
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="total"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip 
             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
             itemStyle={{ color: '#fff' }}
             formatter={(value: number, name: string) => [`${currencySymbol}${value.toLocaleString()}`, name]}
        />
        <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            iconType="circle"
            formatter={(value) => <span className="text-slate-300 text-xs ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}