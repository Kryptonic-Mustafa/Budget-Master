'use client';

import { useEffect, useState } from 'react';
import { Target, AlertCircle, CheckCircle, Edit2, Plus, Trash2, Save, X, Palette } from 'lucide-react';
// 1. Import Settings Hook
import { useSettings } from '@/context/SettingsContext';

export default function BudgetsPage() {
  // 2. Destructure Helpers
  const { formatAmount, showAlert, showConfirm, currencySymbol } = useSettings();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ budget_limit: '', color: '' });

  // Create State
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    budget_limit: '',
    color: '#10b981'
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        // Filter only Expense categories for budgeting
        setCategories(data.filter((c: any) => c.type === 'EXPENSE'));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // --- ACTIONS ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name) return showAlert('Error', 'Category name is required', 'warning');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...createForm, 
            type: 'EXPENSE', // Force type to Expense for budgets
            icon: 'circle'   // Default icon
        })
      });

      if (res.ok) {
        showAlert('Created!', 'Category added successfully.', 'success');
        setShowCreate(false);
        setCreateForm({ name: '', budget_limit: '', color: '#10b981' });
        fetchCategories();
      } else {
        showAlert('Error', 'Failed to create category.', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Network error.', 'error');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm })
      });

      if (res.ok) {
          showAlert('Updated!', 'Budget updated successfully.', 'success');
          setEditingId(null);
          fetchCategories();
      } else {
          showAlert('Error', 'Failed to update.', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Network error.', 'error');
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
        'Delete Category?', 
        'Transactions linked to this category might lose their label.', 
        async () => {
            try {
                const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showAlert('Deleted!', 'Category removed.', 'success');
                    fetchCategories();
                } else {
                    showAlert('Error', 'Failed to delete.', 'error');
                }
            } catch (e) {
                showAlert('Error', 'Network error.', 'error');
            }
    });
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditForm({ budget_limit: cat.budget_limit, color: cat.color || '#64748b' });
  };

  if (loading) return <div className="text-white p-10">Loading budgets...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white">Monthly Budgets</h1>
            <p className="text-slate-400">Set limits and track your spending</p>
        </div>
        <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-cyan-500/20 transition-all"
        >
            {showCreate ? <X size={18}/> : <Plus size={18}/>} 
            {showCreate ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
            <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-white mb-2">Create New Expense Category</h3>
            </div>
            
            <input 
                type="text" 
                placeholder="Category Name (e.g. Dining Out)" 
                className="bg-black/20 p-3 rounded text-white border border-white/10 outline-none focus:border-cyan-500" 
                value={createForm.name}
                onChange={e => setCreateForm({...createForm, name: e.target.value})}
                required 
            />
            
            <div className="relative">
                <span className="absolute left-3 top-3 text-cyan-400 font-bold font-mono">{currencySymbol}</span>
                <input 
                    type="number" 
                    placeholder="Monthly Limit" 
                    className="w-full bg-black/20 p-3 pl-8 rounded text-white border border-white/10 outline-none focus:border-cyan-500 font-mono" 
                    value={createForm.budget_limit}
                    onChange={e => setCreateForm({...createForm, budget_limit: e.target.value})}
                    required
                />
            </div>

            <div className="md:col-span-2 flex items-center gap-4 bg-black/20 p-3 rounded border border-white/10">
                <Palette className="text-slate-400" size={20} />
                <div className="flex gap-3">
                    {['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                        <button type="button" key={c} onClick={() => setCreateForm({...createForm, color: c})}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${createForm.color === c ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            <button type="submit" className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 p-3 rounded-lg font-bold text-white mt-2 shadow-lg">
                Create Category
            </button>
        </form>
      )}

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const spent = parseFloat(cat.spent || '0');
          const limit = parseFloat(cat.budget_limit || '0');
          const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const isOver = limit > 0 && spent > limit;
          
          return (
            <div key={cat.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg relative group hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                        style={{ backgroundColor: cat.color || '#64748b' }}
                   >
                     {/* Use first letter if no icon library mapped */}
                     {cat.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                     <p className="text-xs text-slate-400">EXPENSE</p>
                   </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                    onClick={() => startEdit(cat)} 
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                    title="Edit Budget"
                    >
                    <Edit2 size={16} />
                    </button>
                    <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                    title="Delete Category"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
              </div>

              {/* Progress Bar Area */}
              {editingId === cat.id ? (
                <div className="bg-black/30 p-4 rounded-xl space-y-3 animate-in fade-in border border-white/10">
                    <label className="text-xs font-bold text-slate-300">Update Monthly Limit</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-cyan-400 font-bold font-mono">{currencySymbol}</span>
                        <input 
                            type="number" 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-8 text-white font-mono outline-none focus:border-cyan-500"
                            value={editForm.budget_limit}
                            onChange={e => setEditForm({...editForm, budget_limit: e.target.value})}
                        />
                    </div>
                    
                    {/* Color Picker for Edit */}
                    <div className="flex gap-2 justify-center py-2">
                        {['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6'].map(c => (
                            <button key={c} onClick={() => setEditForm({...editForm, color: c})}
                                className={`w-4 h-4 rounded-full border ${editForm.color === c ? 'border-white scale-125' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs px-3 py-1 hover:text-white">Cancel</button>
                        <button onClick={() => handleUpdate(cat.id)} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1 rounded font-bold">Save</button>
                    </div>
                </div>
              ) : (
                <>
                    <div className="flex justify-between text-sm mb-1 font-mono">
                        <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {formatAmount(spent)}
                        </span>
                        <span className="text-slate-500">
                            / {formatAmount(limit)}
                        </span>
                    </div>
                    
                    {/* The Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                isOver ? 'bg-rose-500' : 
                                percent > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${limit === 0 ? 0 : percent}%` }}
                        ></div>
                    </div>

                    {/* Status Text */}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        {limit === 0 ? (
                            <span className="text-slate-500 flex items-center gap-1"><AlertCircle size={12}/> No limit set</span>
                        ) : isOver ? (
                            <span className="text-rose-400 flex items-center gap-1 font-bold"><AlertCircle size={12}/> Over Budget!</span>
                        ) : (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> On Track</span>
                        )}
                    </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}