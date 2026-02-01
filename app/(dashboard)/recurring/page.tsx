'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Calendar, Clock, ArrowRight } from 'lucide-react';
// 1. Import Settings Hook
import { useSettings } from '@/context/SettingsContext';

export default function RecurringPage() {
  // 2. Destructure helpers
  const { showAlert, showConfirm, formatAmount, currencySymbol } = useSettings();

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Dropdown Data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: ''
  });

  const fetchData = async () => {
    try {
        const [rulesRes, accRes, catRes] = await Promise.all([
            fetch('/api/recurring'),
            fetch('/api/accounts'),
            fetch('/api/categories')
        ]);
        
        if (rulesRes.ok) setRules(await rulesRes.json());
        if (accRes.ok) {
            const accs = await accRes.json();
            setAccounts(accs);
            if (accs.length > 0) setFormData(prev => ({...prev, accountId: accs[0].id}));
        }
        if (catRes.ok) {
            const cats = await catRes.json();
            setCategories(cats);
            if (cats.length > 0) setFormData(prev => ({...prev, categoryId: cats[0].id}));
        }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/recurring', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setShowForm(false);
            // 3. Success Alert
            showAlert('Created!', 'Recurring rule active.', 'success');
            fetchData();
        } else {
            const err = await res.json();
            // 3. Error Alert
            showAlert('Error', err.error || "Error creating rule", 'error');
        }
    } catch (e) { 
        console.error(e);
        showAlert('Error', 'Network error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    // 4. SweetAlert Confirmation
    showConfirm(
      'Stop Recurring Payment?',
      'This will remove the rule. Future transactions will not be generated automatically.',
      async () => {
        try {
            await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' });
            showAlert('Stopped', 'Recurring rule deleted.', 'success');
            fetchData();
        } catch (e) {
            showAlert('Error', 'Failed to delete rule.', 'error');
        }
      }
    );
  };

  const handleManualProcess = async () => {
    const btn = document.getElementById('process-btn') as HTMLButtonElement;
    if(btn) btn.innerHTML = 'Processing...';
    
    try {
        const res = await fetch('/api/recurring/process', { method: 'POST' });
        const data = await res.json();
        // 5. Success Alert for Manual Run
        showAlert('Synced', data.message || "Checked for due payments!", 'success');
    } catch (e) {
        showAlert('Error', 'Failed to run checks', 'error');
    }

    if(btn) btn.innerHTML = 'Run Checks Now';
    fetchData();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Recurring</h1>
            <p className="text-slate-400">Automate your subscriptions & salary</p>
        </div>
        <div className="flex gap-3">
            <button 
                id="process-btn"
                onClick={handleManualProcess}
                className="flex items-center gap-2 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 px-4 py-2 rounded-lg font-bold transition-all"
            >
                <RefreshCw size={18}/> Run Checks Now
            </button>
            <button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-cyan-500/20 transition-all"
            >
                <Plus size={18}/> New Rule
            </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
            <input type="text" placeholder="Description (e.g. Netflix)" className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" required 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            
            <div className="relative">
                <span className="absolute left-3 top-3 text-cyan-400 font-bold font-mono">{currencySymbol}</span>
                <input type="number" step="0.01" placeholder="Amount" className="w-full bg-black/20 p-3 pl-8 rounded text-white border border-white/10 outline-none focus:border-cyan-500 font-mono" required 
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>

            <select className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})}>
                <option value="DAILY" className="bg-slate-800">Daily</option>
                <option value="WEEKLY" className="bg-slate-800">Weekly</option>
                <option value="MONTHLY" className="bg-slate-800">Monthly</option>
                <option value="YEARLY" className="bg-slate-800">Yearly</option>
            </select>

            <select className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="EXPENSE" className="bg-slate-800">Expense</option>
                <option value="INCOME" className="bg-slate-800">Income</option>
            </select>

            <select className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                {categories.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>)}
            </select>
            
            <select className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                {accounts.map(a => <option key={a.id} value={a.id} className="bg-slate-800">{a.name}</option>)}
            </select>

            <div className="md:col-span-2">
                <label className="text-xs text-slate-400 font-bold ml-1">Start Date</label>
                <input type="date" className="w-full bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500 [color-scheme:dark]" required 
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>

            <button type="submit" className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 p-3 rounded-lg font-bold text-white mt-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.01] transition-transform">Create Rule</button>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map(rule => (
            <div key={rule.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${rule.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{rule.description}</h3>
                            <span className="text-xs text-slate-400 uppercase font-bold">{rule.frequency}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(rule.id)} 
                        className="text-slate-500 hover:text-rose-500 p-1 hover:bg-rose-500/10 rounded transition-all"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-2xl font-bold font-mono ${rule.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {/* 6. Use Global Formatter */}
                        {formatAmount(rule.amount)}
                    </span>
                    <span className="text-sm text-slate-500">/ {rule.frequency.toLowerCase()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300 bg-black/30 p-2 rounded-lg border border-white/5">
                    <Calendar size={14} className="text-cyan-400" />
                    <span>Next: {new Date(rule.next_run_date).toLocaleDateString()}</span>
                </div>
            </div>
        ))}
        {rules.length === 0 && !loading && <div className="text-slate-500 col-span-full text-center py-10 border border-dashed border-slate-700 rounded-2xl">No recurring rules set.</div>}
      </div>
    </div>
  );
}