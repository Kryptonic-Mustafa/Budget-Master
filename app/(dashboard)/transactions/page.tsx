'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, FileText, Download } from 'lucide-react';
import TransactionForm from '@/components/forms/TransactionForm';
// 1. Import Settings Hook
import { useSettings } from '@/context/SettingsContext';

export default function TransactionsPage() {
  // 2. Destructure Helpers
  const { formatAmount, showConfirm, showAlert } = useSettings();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      // Build Query String
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchTransactions, 300); // Debounce search
    return () => clearTimeout(delay);
  }, [search, typeFilter]);

  // --- ACTIONS ---

  const handleDelete = (id: number) => {
    showConfirm(
      'Delete Transaction?', 
      'This action cannot be undone.', 
      async () => {
        // Optimistic UI Update (Remove immediately)
        const prev = [...transactions];
        setTransactions(transactions.filter(t => t.id !== id));

        try {
          const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
             showAlert('Deleted!', 'Transaction removed.', 'success');
          } else {
             // Revert if failed
             setTransactions(prev);
             showAlert('Error', 'Failed to delete.', 'error');
          }
        } catch (err) {
          setTransactions(prev);
          showAlert('Error', 'Network error.', 'error');
        }
    });
  };

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTx(null);
    fetchTransactions();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400">History of your income and expenses</p>
        </div>
        <button 
          onClick={() => { setEditingTx(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus size={20} /> Add Transaction
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative group md:col-span-2">
            <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 text-white outline-none focus:border-cyan-500 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
        </div>
        <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-400" size={20} />
            <select 
                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 text-white outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
            >
                <option value="ALL" className="bg-slate-800">All Types</option>
                <option value="INCOME" className="bg-slate-800">Income</option>
                <option value="EXPENSE" className="bg-slate-800">Expense</option>
            </select>
        </div>
      </div>

      {/* FORM SECTION */}
      {showForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
            <TransactionForm 
                onSuccess={handleFormSuccess} 
                onCancel={() => setShowForm(false)}
                initialData={editingTx}
            />
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Description</th>
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold">Receipt</th>
                        <th className="p-4 font-bold text-right">Amount</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading transactions...</td></tr>
                    ) : transactions.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No transactions found.</td></tr>
                    ) : (
                        transactions.map((t) => (
                            <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 text-slate-300 whitespace-nowrap">
                                    {new Date(t.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-white font-medium">{t.description}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-white/10 text-xs text-slate-300 border border-white/5">
                                        {t.category_name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {t.receipt_data ? (
                                        <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs">
                                            <FileText size={14} /> View
                                        </button>
                                    ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                    )}
                                </td>
                                <td className={`p-4 text-right font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}{formatAmount(t.amount)}
                                </td>
                                <td className="p-4">
                                    {/* --- FIX: Removed opacity classes, added proper text colors --- */}
                                    <div className="flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => handleEdit(t)}
                                            className="text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 p-2 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(t.id)}
                                            className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}