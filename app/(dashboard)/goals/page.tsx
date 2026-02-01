'use client';

import { useEffect, useState } from 'react';
import { Target, Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';
// 1. Import Settings Hook
import { useSettings } from '@/context/SettingsContext';

export default function GoalsPage() {
  // 2. Destructure Alert and Format helpers
  const { showAlert, showConfirm, formatAmount, currencySymbol } = useSettings();

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Contribution State
  const [contributeId, setContributeId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    color: '#10b981'
  });

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/savings');
      if (res.ok) setGoals(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/savings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setShowForm(false);
            // 3. Success Alert
            showAlert('Goal Created', 'Time to start saving!', 'success');
            fetchGoals();
            // Reset form
            setFormData({ name: '', target_amount: '', current_amount: '', target_date: '', color: '#10b981' });
        } else {
            showAlert('Error', 'Failed to create goal', 'error');
        }
    } catch (e) {
        showAlert('Error', 'Network error', 'error');
    }
  };

  const handleContribute = async (id: number) => {
    if(!contributeAmount) return;
    
    try {
        const res = await fetch('/api/savings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, amount: contributeAmount })
        });

        if (res.ok) {
            setContributeId(null);
            setContributeAmount('');
            // 4. Contribution Success Alert
            showAlert('Funds Added', 'You are closer to your goal!', 'success');
            fetchGoals();
        } else {
            showAlert('Error', 'Failed to update balance', 'error');
        }
    } catch (e) {
        showAlert('Error', 'Network error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    // 5. SweetAlert Confirmation
    showConfirm(
      'Delete Goal?', 
      'This will remove your progress permanently.', 
      async () => {
        try {
            await fetch(`/api/savings?id=${id}`, { method: 'DELETE' });
            showAlert('Deleted', 'Goal removed.', 'success');
            fetchGoals();
        } catch (e) {
            showAlert('Error', 'Failed to delete goal.', 'error');
        }
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white">Savings Goals</h1>
            <p className="text-slate-400">Track your dreams and targets</p>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-cyan-500/20 transition-all"
        >
            <Plus size={18}/> New Goal
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
            <input type="text" placeholder="Goal Name (e.g. New Car)" className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" required 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            
            <div className="relative">
                <span className="absolute left-3 top-3 text-cyan-400 font-bold font-mono">{currencySymbol}</span>
                <input type="number" placeholder="Target Amount" className="w-full bg-black/20 p-3 pl-8 rounded text-white border border-white/10 outline-none focus:border-cyan-500 font-mono" required 
                    value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
            </div>

            <div className="relative">
                <span className="absolute left-3 top-3 text-cyan-400 font-bold font-mono">{currencySymbol}</span>
                <input type="number" placeholder="Starting Balance" className="w-full bg-black/20 p-3 pl-8 rounded text-white border border-white/10 outline-none focus:border-cyan-500 font-mono" 
                    value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} />
            </div>

            <input type="date" className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500 [color-scheme:dark]" 
                value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />
            
            <div className="md:col-span-2 flex gap-4">
                {['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6'].map(c => (
                    <button type="button" key={c} onClick={() => setFormData({...formData, color: c})}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>

            <button type="submit" className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 p-3 rounded-lg font-bold text-white mt-2 shadow-lg hover:opacity-90 transition-opacity">Create Goal</button>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
            const current = parseFloat(goal.current_amount);
            const target = parseFloat(goal.target_amount);
            const percent = Math.min((current / target) * 100, 100);
            
            return (
                <div key={goal.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative hover:bg-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: goal.color }}>
                                <Target size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{goal.name}</h3>
                                {goal.target_date && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(goal.target_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(goal.id)} 
                            className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                            <Trash2 size={18}/>
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1 font-mono">
                            {/* 6. Use Global Formatter */}
                            <span className="text-white font-bold">{formatAmount(current)}</span>
                            <span className="text-slate-500">of {formatAmount(target)}</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                            <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${percent}%`, backgroundColor: goal.color }}></div>
                        </div>
                    </div>

                    {contributeId === goal.id ? (
                        <div className="flex gap-2 animate-in fade-in">
                            <input 
                                type="number" 
                                placeholder="Amount" 
                                className="w-full bg-black/20 p-2 rounded text-white text-sm outline-none focus:ring-1 ring-cyan-500"
                                autoFocus
                                value={contributeAmount}
                                onChange={e => setContributeAmount(e.target.value)}
                            />
                            <button onClick={() => handleContribute(goal.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded text-sm font-bold transition-colors">Save</button>
                            <button onClick={() => setContributeId(null)} className="text-slate-400 hover:text-white px-2">X</button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setContributeId(goal.id)}
                            className="w-full py-2 border border-white/10 rounded-lg text-sm text-cyan-400 font-bold hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <TrendingUp size={16} /> Add Funds
                        </button>
                    )}
                </div>
            );
        })}
        {goals.length === 0 && !loading && <div className="text-slate-500 col-span-full text-center py-10 border border-dashed border-slate-700 rounded-2xl">No savings goals yet. Dream big!</div>}
      </div>
    </div>
  );
}