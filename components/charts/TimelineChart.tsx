'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';

interface TimelineChartProps {
  data: any[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>

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
          // FIX: Cast as any
          tickFormatter={((value: any) => `$${Number(value) / 1000}k`) as any}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff',
          }}
          itemStyle={{ color: '#fff', padding: '2px 0' }}
          // FIX: Cast as any
          formatter={((value: any, name: any) => [formatCurrency(value), name]) as any}
        />

        <Legend wrapperStyle={{ paddingTop: '20px' }} />

        <Area type="monotone" dataKey="income" fill="url(#colorIncome)" stroke="none" />
        <Area type="monotone" dataKey="expense" fill="url(#colorExpense)" stroke="none" />

        <Bar dataKey="income" name="Income" barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" barSize={20} fill="#f43f5e" radius={[4, 4, 0, 0]} />

        <Line 
          type="monotone" 
          dataKey="income" 
          name="Income Trend"
          stroke="#34d399" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#fff' }} 
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          name="Expense Trend"
          stroke="#fb7185" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#fb7185', strokeWidth: 2, stroke: '#fff' }} 
        />

      </ComposedChart>
    </ResponsiveContainer>
  );
}