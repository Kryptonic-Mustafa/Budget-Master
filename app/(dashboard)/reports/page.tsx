'use client';

import { useEffect, useState } from 'react';
import MonthlyChart from '@/components/charts/MonthlyChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import TimelineChart from '@/components/charts/TimelineChart'; // Import new Chart
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';

export default function ReportsPage() {
  const [chartData, setChartData] = useState<{ history: any[], categories: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stats/charts');
        if (res.ok) {
          const json = await res.json();
          // The API returns 'history' which we can use for the timeline
          setChartData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="text-white p-10 flex gap-2 items-center">
      <div className="w-5 h-5 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent"></div> 
      Loading analytics...
    </div>
  );
  
  if (!chartData) return <div className="text-white p-10">No data available</div>;

  const topCategory = chartData.categories.length > 0 ? chartData.categories[0].name : 'None';

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
        <p className="text-slate-400">Deep dive into your spending habits</p>
      </div>

      {/* --- ROW 1: FULL WIDTH TIMELINE (Col-12) --- */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Activity className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Financial Timeline</h3>
            </div>
            <select className="bg-black/20 border border-white/10 rounded-lg text-xs text-slate-300 px-3 py-1 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
            </select>
        </div>
        
        <div className="h-80 w-full">
            {chartData.history.length > 0 ? (
                <TimelineChart data={chartData.history} />
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                    Not enough data for timeline
                </div>
            )}
        </div>
      </div>

      {/* --- ROW 2: SPLIT CHARTS (Col-6 + Col-6) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Bar Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Income vs Expense</h3>
          </div>
          <div className="h-64">
            {chartData.history.length > 0 ? (
               <MonthlyChart data={chartData.history} />
            ) : (
               <div className="h-full flex items-center justify-center text-slate-500">Not enough data</div>
            )}
          </div>
        </div>

        {/* Category Doughnut Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-rose-400" />
            <h3 className="text-lg font-bold text-white">Spending by Category</h3>
          </div>
          <div className="h-64">
             {chartData.categories.length > 0 ? (
                <CategoryPieChart data={chartData.categories} />
             ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No expenses recorded</div>
             )}
          </div>
        </div>

      </div>

      {/* Insight Card */}
      {chartData.categories.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/20 p-6 rounded-2xl flex items-start gap-4">
            <div className="bg-cyan-500/20 p-3 rounded-full">
                <TrendingUp className="text-cyan-400" size={24} />
            </div>
            <div>
                <h4 className="text-cyan-400 font-bold mb-1">AI Spending Insight</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                   Based on your recent activity, your top spending category is 
                   <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded mx-1">{topCategory}</span>. 
                   Consider setting a monthly budget for this category to save more!
                </p>
            </div>
        </div>
      )}
    </div>
  );
}