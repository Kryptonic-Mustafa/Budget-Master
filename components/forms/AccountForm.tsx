'use client';

import { useState, useEffect } from 'react';
import { Plus, Wallet, Check, Save, X } from 'lucide-react';

interface AccountFormProps {
  onSuccess: (account: any, isEdit: boolean) => void;
  onCancel: () => void;
  initialData?: any; // If provided, we are in Edit Mode
}

export default function AccountForm({ onSuccess, onCancel, initialData }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  
  const colors = [
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Cyan', hex: '#06b6d4' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    balance: '',
    color: '#3b82f6'
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        balance: initialData.balance,
        color: initialData.color
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = initialData ? 'PUT' : 'POST';
      const body = initialData ? { ...formData, id: initialData.id } : formData;

      const res = await fetch('/api/accounts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        // Pass the result back to parent immediately
        // If creating, data is the new account. If editing, construct it.
        const resultAccount = initialData 
            ? { ...initialData, ...formData, balance: parseFloat(formData.balance as string) } 
            : data;
            
        onSuccess(resultAccount, !!initialData);
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-cyan-400" /> 
          {initialData ? 'Edit Account' : 'New Account Details'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Account Name</label>
          <input
            type="text"
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-400 uppercase">Account Type</label>
            <select
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="CASH" className="bg-slate-800">Cash</option>
              <option value="BANK" className="bg-slate-800">Bank</option>
              <option value="CREDIT" className="bg-slate-800">Credit Card</option>
              <option value="WALLET" className="bg-slate-800">Digital Wallet</option>
              <option value="INVESTMENT" className="bg-slate-800">Investment</option>
            </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Current Balance</label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
            value={formData.balance}
            onChange={e => setFormData({...formData, balance: e.target.value})}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Color Tag</label>
          <div className="flex gap-3">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: c.hex }))}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                   formData.color === c.hex 
                   ? 'ring-2 ring-white scale-110 shadow-lg' 
                   : 'opacity-50 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {formData.color === c.hex && <Check size={16} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="md:col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-cyan-500/40 transition-all mt-2 flex justify-center items-center gap-2"
        >
          {loading ? 'Saving...' : (initialData ? <><Save size={18}/> Save Changes</> : <><Plus size={18}/> Create Account</>)}
        </button>
      </form>
    </div>
  );
}