'use client';

import { useEffect, useState, useCallback } from 'react';
import TransactionForm from '@/components/forms/TransactionForm';
import { Clock, AlertCircle } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState({ 
    totalBalance: 0, 
    monthlyIncome: 0, 
    monthlyExpense: 0, 
    upcomingBills: [] 
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="text-white p-10">Loading dashboard...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Real-time financial snapshot.</p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10"><div className="w-24 h-24 bg-cyan-500 rounded-full blur-2xl"></div></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</h3>
            <p className="text-4xl font-extrabold text-white mt-2">${data.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Income</h3>
            <p className="text-3xl font-bold text-emerald-400 mt-2">+${data.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Expenses</h3>
            <p className="text-3xl font-bold text-rose-400 mt-2">-${data.monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column: Upcoming Bills Widget */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Upcoming Bills (Next 7 Days)</h3>
                </div>
                
                <div className="space-y-3">
                    {data.upcomingBills && (data.upcomingBills as any[]).length > 0 ? (
                        (data.upcomingBills as any[]).map((bill: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border-l-2 border-amber-400">
                                <div>
                                    <p className="font-bold text-white">{bill.description}</p>
                                    <p className="text-xs text-slate-400">Due: {new Date(bill.next_run_date).toLocaleDateString()}</p>
                                </div>
                                <span className="text-rose-400 font-mono font-bold">-${parseFloat(bill.amount).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500 p-2">
                            <AlertCircle size={16} /> No bills due soon. Relax!
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl flex items-center justify-center text-slate-500 h-32">
                 <p>Analytics Chart Area (See Reports)</p>
            </div>
        </div>

        {/* Right Column: Add Transaction Form */}
        <div className="lg:col-span-1">
             <TransactionForm onSuccess={() => fetchData()} />
        </div>
      </div>
    </div>
  );
}