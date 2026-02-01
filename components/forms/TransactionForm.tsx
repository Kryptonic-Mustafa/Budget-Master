'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, X, Calendar, FileText, Wallet, Tag, Paperclip, Trash } from 'lucide-react';
// Import Hook
import { useSettings } from '@/context/SettingsContext';

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function TransactionForm({ onSuccess, onCancel, initialData }: TransactionFormProps) {
  // Use Global Settings & Alerts
  const { currencySymbol, showAlert } = useSettings();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]); 
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    accountId: '',
    receipt_data: '' 
  });

  // ... (Keep existing fetch Data logic unchanged) ...
  useEffect(() => {
    const loadData = async () => {
        try {
            const accRes = await fetch('/api/accounts');
            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(accData);
                if (accData.length > 0 && !initialData) setFormData(prev => ({ ...prev, accountId: accData[0].id }));
            }
            const catRes = await fetch('/api/categories');
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData);
                if (catData.length > 0 && !initialData) setFormData(prev => ({ ...prev, categoryId: catData[0].id }));
            }
        } catch (err) { console.error("Failed to load form data"); }
    };
    loadData();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount,
        type: initialData.type,
        description: initialData.description || '',
        date: initialData.transaction_date ? new Date(initialData.transaction_date).toISOString().split('T')[0] : '',
        categoryId: initialData.category_id,
        accountId: initialData.account_id,
        receipt_data: initialData.receipt_data || ''
      });
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { 
            showAlert('File Too Large', 'Max file size is 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, receipt_data: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId || !formData.categoryId) {
        showAlert('Validation Error', 'Please select an account and category', 'warning');
        return;
    }

    setLoading(true);
    try {
      const method = initialData ? 'PUT' : 'POST';
      const body = initialData ? { ...formData, id: initialData.id } : formData;

      const res = await fetch('/api/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        if (!initialData) setFormData(prev => ({ ...prev, amount: '', description: '', receipt_data: '' })); 
        // SUCCESS ALERT
        showAlert(
            initialData ? 'Updated!' : 'Created!', 
            `Transaction successfully ${initialData ? 'updated' : 'added'}.`, 
            'success'
        );
        onSuccess(); 
      } else {
        const err = await res.json();
        showAlert('Error', err.error || 'Operation failed', 'error');
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl h-fit max-h-[90vh] overflow-y-auto">
      {/* ... (Keep Header Code same) ... */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {initialData ? <Save size={20} className="text-cyan-400" /> : <Plus size={20} className="text-cyan-400" />}
          {initialData ? 'Edit Transaction' : 'New Transaction'}
        </h3>
        {onCancel && <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white"><X size={20} /></button>}
      </div>

      <div className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-lg">
          {['INCOME', 'EXPENSE'].map(t => (
             <label key={t} className={`cursor-pointer text-center py-2 rounded-md transition-all ${formData.type === t ? (t === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600') + ' text-white' : 'text-slate-400 hover:bg-white/5'}`}>
               <input type="radio" name="type" value={t} className="hidden" checked={formData.type === t} onChange={e => setFormData({...formData, type: e.target.value})} />
               <span className="font-bold text-sm capitalize">{t.toLowerCase()}</span>
             </label>
          ))}
        </div>

        {/* Amount Input with Dynamic Currency Symbol */}
        <div className="relative group">
            {/* DYNAMIC SYMBOL FROM SETTINGS */}
            <span className="absolute left-3 top-3 text-cyan-400 font-bold font-mono">
                {currencySymbol}
            </span>
            <input type="number" step="0.0001" placeholder="Amount" 
                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white outline-none focus:border-cyan-500 font-mono" required 
                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
        </div>
        
        {/* ... (Keep Description, Date, Accounts, Category, File Upload SAME as before) ... */}
        
        <div className="relative group">
            <FileText className="absolute left-3 top-3 text-slate-500" size={16} />
            <input type="text" placeholder="Description" className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white outline-none focus:border-cyan-500" 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        
        <div className="relative group">
            <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
            <input type="date" className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white outline-none focus:border-cyan-500 [color-scheme:dark]" required 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
                <Wallet className="absolute left-3 top-3 text-slate-500" size={16} />
                <select className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white outline-none focus:border-cyan-500 appearance-none" required 
                    value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                    {accounts.map(a => <option key={a.id} value={a.id} className="bg-slate-800">{a.name}</option>)}
                </select>
            </div>
            <div className="relative group">
                <Tag className="absolute left-3 top-3 text-slate-500" size={16} />
                <select className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white outline-none focus:border-cyan-500 appearance-none" required 
                    value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>)}
                </select>
            </div>
        </div>

        <div className="border border-dashed border-white/20 rounded-lg p-4 text-center hover:bg-white/5 transition-colors">
            <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
            
            {!formData.receipt_data ? (
                <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2 text-slate-400">
                    <Paperclip size={24} />
                    <span className="text-sm">Attach Receipt (Max 2MB)</span>
                </label>
            ) : (
                <div className="relative">
                    <img src={formData.receipt_data} alt="Preview" className="h-32 mx-auto rounded-lg object-contain border border-white/10" />
                    <button type="button" onClick={() => setFormData(p => ({...p, receipt_data: ''}))} 
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                        <Trash size={14} />
                    </button>
                </div>
            )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg mt-4 disabled:opacity-50">
          {loading ? 'Processing...' : (initialData ? 'Save Changes' : 'Add Transaction')}
        </button>
      </div>
    </form>
  );
}