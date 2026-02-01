'use client';

import { useEffect, useState } from 'react';
import AccountForm from '@/components/forms/AccountForm';
import { Trash2, CreditCard, Plus, Edit2 } from 'lucide-react';
// 1. Import the Settings Context
import { useSettings } from '@/context/SettingsContext';

export default function AccountsPage() {
  // 2. Destructure Alert Helpers and Formatters
  const { showConfirm, showAlert, formatAmount } = useSettings();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Form Visibility & Editing
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // --- Real-time Handlers ---

  const handleDelete = async (id: number) => {
    // 3. Use SweetAlert Confirmation
    showConfirm(
      'Delete Account?', 
      'This will permanently remove the account and all associated transactions.', 
      async () => {
        // --- Code runs only if "Yes" is clicked ---
        
        // Optimistic Update
        const previousAccounts = [...accounts];
        setAccounts(accounts.filter(acc => acc.id !== id));

        try {
          const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete');
          
          // Success Notification
          showAlert('Deleted!', 'Account has been removed.', 'success');
          
        } catch (err) {
          // Revert if failed
          setAccounts(previousAccounts);
          showAlert('Error', 'Failed to delete account.', 'error');
        }
    });
  };

  const handleFormSuccess = (account: any, isEdit: boolean) => {
    if (isEdit) {
      setAccounts(accounts.map(acc => acc.id === account.id ? account : acc));
      showAlert('Updated!', `Account "${account.name}" updated successfully.`, 'success');
    } else {
      setAccounts([account, ...accounts]);
      showAlert('Created!', `Account "${account.name}" added successfully.`, 'success');
    }
    closeForm();
  };

  const openCreateForm = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const openEditForm = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Accounts</h1>
          <p className="text-slate-400">Manage your cards and wallets</p>
        </div>
        
        {!showForm && (
            <button 
                onClick={openCreateForm}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all font-semibold"
            >
                <Plus size={20} /> Add New Account
            </button>
        )}
      </div>

      {/* Form Area */}
      {showForm && (
        <AccountForm 
            onSuccess={handleFormSuccess} 
            onCancel={closeForm}
            initialData={editingAccount}
        />
      )}

      {/* Accounts Grid */}
      {loading ? (
        <div className="text-white flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent"></div>
            Loading accounts...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div 
              key={acc.id} 
              className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg relative z-10"
                  style={{ backgroundColor: acc.color }}
                >
                  <CreditCard size={20} />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditForm(acc)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{acc.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{acc.type}</p>
              
              {/* 4. Use Global Format Amount (Optional but recommended for consistency) */}
              <div className="text-2xl font-mono text-cyan-400">
                {formatAmount(acc.balance)}
              </div>
            </div>
          ))}
          
          {accounts.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              <p className="mb-4">No accounts found.</p>
              <button onClick={openCreateForm} className="text-cyan-400 hover:underline">
                Create your first account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}