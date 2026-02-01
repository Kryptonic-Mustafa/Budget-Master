'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSettings } from '@/context/SettingsContext';

interface MonthlyChartProps {
  data: any[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const { currencySymbol } = useSettings();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis 
            dataKey="month" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
        />
        <YAxis 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            // FIX: Cast 'as any' to silence strict type checks
            tickFormatter={((value: any) => `${currencySymbol}${Number(value) / 1000}k`) as any}
            tickLine={false}
            axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
          // FIX: Cast 'as any' to silence strict type checks
          formatter={((value: any, name: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, name]) as any}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }}/>
        
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
        <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}