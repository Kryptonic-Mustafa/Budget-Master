'use client';

import { useState, useEffect } from 'react';
import { countries } from 'countries-list';
import { Save, Globe, DollarSign, Hash, AlertTriangle, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useRouter } from 'next/navigation';

const MySwal = withReactContent(Swal);

// --- HELPER COMPONENT FOR THE MODAL ---
function DataResetPreview({ data }: { data: any }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const Section = ({ title, items, id, columns, renderRow }: any) => (
    <div className="border border-white/10 rounded-lg bg-slate-900 overflow-hidden mb-2">
      <button 
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
            {openSection === id ? <ChevronDown size={16} className="text-cyan-400"/> : <ChevronRight size={16} className="text-slate-500"/>}
            {title}
        </span>
        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full font-mono">
            {items?.length || 0} Items
        </span>
      </button>
      
      {openSection === id && items?.length > 0 && (
        <div className="border-t border-white/10 p-0 overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-slate-500 sticky top-0">
                    <tr>
                        {columns.map((c: string) => <th key={c} className="p-2 font-medium">{c}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                    {items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5">
                            {renderRow(item)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="text-left w-full mt-2">
       <Section 
         id="tx" title="Transactions" items={data.transactions} 
         columns={['Date', 'Desc', 'Amount', 'Type']}
         renderRow={(i: any) => (
            <>
                <td className="p-2 whitespace-nowrap text-slate-400">{new Date(i.date).toLocaleDateString()}</td>
                <td className="p-2">{i.description}</td>
                <td className={`p-2 font-mono ${i.type==='INCOME'?'text-emerald-400':'text-rose-400'}`}>{i.amount}</td>
                <td className="p-2 text-[10px] opacity-70">{i.type}</td>
            </>
         )}
       />
       <Section 
         id="acc" title="Accounts" items={data.accounts} 
         columns={['Name', 'Type', 'Balance']}
         renderRow={(i: any) => (
            <>
                <td className="p-2 font-medium text-white">{i.name}</td>
                <td className="p-2 text-slate-400">{i.type}</td>
                <td className="p-2 font-mono text-cyan-400">{i.balance}</td>
            </>
         )}
       />
       <Section 
         id="cat" title="Categories" items={data.categories} 
         columns={['Name', 'Type', 'Limit']}
         renderRow={(i: any) => (
            <>
                <td className="p-2 font-medium">{i.name}</td>
                <td className="p-2 text-slate-400">{i.type}</td>
                <td className="p-2 font-mono">{i.budget_limit}</td>
            </>
         )}
       />
       <Section 
         id="sav" title="Savings Goals" items={data.savings_goals} 
         columns={['Goal', 'Current', 'Target']}
         renderRow={(i: any) => (
            <>
                <td className="p-2 font-medium text-emerald-400">{i.name}</td>
                <td className="p-2">{i.current_amount}</td>
                <td className="p-2 opacity-70">{i.target_amount}</td>
            </>
         )}
       />
        <Section 
         id="rec" title="Recurring Rules" items={data.recurring_rules} 
         columns={['Desc', 'Freq', 'Amount']}
         renderRow={(i: any) => (
            <>
                <td className="p-2 font-medium">{i.description}</td>
                <td className="p-2 text-orange-400 text-[10px] uppercase">{i.frequency}</td>
                <td className="p-2 font-mono">{i.amount}</td>
            </>
         )}
       />
       
       <div className="flex items-start gap-3 bg-rose-500/10 p-3 rounded border border-rose-500/30 mt-4">
            <input type="checkbox" id="delete_user_checkbox" className="mt-1 w-4 h-4 accent-rose-500 cursor-pointer" />
            <label htmlFor="delete_user_checkbox" className="text-rose-300 font-bold cursor-pointer select-none text-sm">
                ALSO DELETE MY ACCOUNT<br/>
                <span className="text-xs font-normal text-rose-400 block mt-1">
                    Checking this will wipe your login credentials permanently. You will not be able to log in again.
                </span>
            </label>
        </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function SettingsPage() {
  const router = useRouter();
  const { country, currency, currencySymbol, decimals, refreshSettings, showAlert } = useSettings();

  const [formData, setFormData] = useState({
    country: 'US', currency: 'USD', currency_symbol: '$', decimals: 2
  });

  useEffect(() => {
    setFormData({ country, currency, currency_symbol: currencySymbol, decimals });
  }, [country, currency, currencySymbol, decimals]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const countryData = (countries as any)[code];
    if (!countryData) return;
    let mainCurrency = Array.isArray(countryData.currency) ? countryData.currency[0] : countryData.currency.split(',')[0];
    setFormData({ ...formData, country: code, currency: mainCurrency });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await fetch('/api/settings', { method: 'POST', body: JSON.stringify(formData) });
        showAlert('Settings Saved', 'Preferences updated.', 'success');
        refreshSettings();
    } catch (err) { console.error(err); }
  };

  const handleDangerZone = async () => {
    let previewData: any = {};
    try {
        const res = await fetch('/api/settings/reset');
        if(res.ok) previewData = await res.json();
    } catch(e) { console.error("Could not fetch data"); }

    // RENDER REACT COMPONENT INSIDE SWEETALERT
    const result = await MySwal.fire({
        title: <div className="text-rose-500 font-bold flex items-center justify-center gap-2"><AlertTriangle/> SYSTEM RESET</div>,
        html: <DataResetPreview data={previewData} />,
        showCancelButton: true,
        confirmButtonText: 'Yes, WIPE EVERYTHING',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#334155',
        width: '600px',
        background: '#0f172a',
        color: '#fff',
        focusCancel: true,
        preConfirm: () => {
            const checkbox = document.getElementById('delete_user_checkbox') as HTMLInputElement;
            return { deleteUser: checkbox?.checked || false };
        }
    });

    if (result.isConfirmed) {
        const { deleteUser } = result.value;
        const finalConfirm = await MySwal.fire({
            title: 'Final Warning',
            text: deleteUser ? "Deleting Account & Data. This is irreversible." : "Deleting All Data. You will be logged out.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'EXECUTE DELETE',
            confirmButtonColor: '#e11d48',
            background: '#0f172a',
            color: '#fff'
        });

        if (finalConfirm.isConfirmed) {
            try {
                const delRes = await fetch('/api/settings/reset', {
                    method: 'DELETE',
                    body: JSON.stringify({ deleteUser })
                });

                if (delRes.ok) {
                    await MySwal.fire({ title: 'System Reset', text: 'Goodbye.', icon: 'success', timer: 2000, showConfirmButton: false, background: '#0f172a', color:'#fff' });
                    router.push('/portal');
                    router.refresh();
                } else {
                    showAlert('Error', 'Reset failed.', 'error');
                }
            } catch (e) { showAlert('Error', 'Network error.', 'error'); }
        }
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Master Settings</h1>
        <p className="text-slate-400">Configure global currency, formats, and localization.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Globe size={16} className="text-cyan-400"/> Primary Country
            </label>
            <select value={formData.country} onChange={handleCountryChange} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none">
                {Object.entries(countries).map(([code, data]: [string, any]) => (
                    <option key={code} value={code} className="bg-slate-800">{data.emoji} {data.name}</option>
                ))}
            </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400"/> Currency Code</label>
                <input type="text" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value.toUpperCase()})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none" />
            </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><span className="text-amber-400 font-serif text-lg leading-none">∑</span> Symbol</label>
                <input type="text" value={formData.currency_symbol} onChange={(e) => setFormData({...formData, currency_symbol: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none" />
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 flex items-center gap-2"><Hash size={16} className="text-purple-400"/> Decimal Places</label>
            <select value={formData.decimals} onChange={(e) => setFormData({...formData, decimals: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none">
                {[0,1,2,3,4].map(n => <option key={n} value={n} className="bg-slate-800">{n}</option>)}
            </select>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <Save size={20} /> Save Global Settings
        </button>
      </form>

      <div className="border border-rose-500/30 bg-rose-900/10 rounded-2xl overflow-hidden">
        <div className="bg-rose-900/20 p-4 border-b border-rose-500/20 flex items-center gap-2">
            <AlertTriangle className="text-rose-500" />
            <h3 className="text-rose-400 font-bold text-lg">Danger Zone</h3>
        </div>
        <div className="p-6">
            <p className="text-slate-400 mb-6">Performing these actions will permanently delete your financial data. This action cannot be undone. Please be certain.</p>
            <button type="button" onClick={handleDangerZone} className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 transition-all">
                <Trash2 size={18} /> Delete System Data
            </button>
        </div>
      </div>
    </div>
  );
}