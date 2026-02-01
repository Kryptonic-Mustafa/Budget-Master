'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Accounts for dropdown
  useEffect(() => {
    fetch('/api/accounts').then(res => res.json()).then(data => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccount(data[0].id);
    });
  }, []);

  // Handle File Drop
  const onDrop = (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            // Transform CSV data to our format
            // Assumes CSV has headers like: Date, Description, Amount
            const cleanData = results.data.map((row: any) => {
                const amount = parseFloat(row.Amount || row.amount || '0');
                return {
                    date: row.Date || row.date || new Date().toISOString().split('T')[0],
                    description: row.Description || row.description || 'Imported Transaction',
                    amount: Math.abs(amount), // Convert to positive for storage
                    type: amount < 0 ? 'EXPENSE' : 'INCOME' // Detect type based on sign
                };
            });
            setParsedData(cleanData);
        },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: { 'text/csv': ['.csv'] } 
  });

  // Handle Save
  const handleImport = async () => {
    if (!selectedAccount) return alert("Select an account!");
    setLoading(true);

    try {
        const res = await fetch('/api/transactions/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: parsedData, accountId: parseInt(selectedAccount) })
        });

        if (res.ok) {
            alert("Import Successful!");
            router.push('/transactions');
        } else {
            alert("Import failed. Check your CSV format.");
        }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Import Data</h1>
        <p className="text-slate-400">Upload bank statements (CSV) to bulk add transactions.</p>
      </div>

      {/* Step 1: Select Account */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <label className="text-slate-300 font-bold mb-2 block">1. Select Target Account</label>
        <select 
            className="w-full md:w-1/2 bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
        >
            {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-slate-800">{acc.name}</option>
            ))}
        </select>
      </div>

      {/* Step 2: Dropzone */}
      {!file ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-xl text-white font-bold">Drag & drop your CSV here</p>
            <p className="text-slate-500 mt-2">or click to browse files</p>
            <div className="mt-6 text-xs text-slate-500 bg-black/20 inline-block px-4 py-2 rounded-lg">
                Required Columns: <b>Date, Description, Amount</b>
            </div>
          </div>
      ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-emerald-400" />
                    <div>
                        <p className="text-white font-bold">{file.name}</p>
                        <p className="text-xs text-slate-400">{parsedData.length} transactions found</p>
                    </div>
                </div>
                <button onClick={() => { setFile(null); setParsedData([]); }} className="text-rose-400 hover:text-white text-sm">Remove File</button>
            </div>
            
            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                        {parsedData.slice(0, 50).map((row, i) => (
                            <tr key={i}>
                                <td className="p-3">{row.date}</td>
                                <td className="p-3">{row.description}</td>
                                <td className="p-3 text-right">${row.amount}</td>
                                <td className="p-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${row.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {row.type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end">
                <button 
                    onClick={handleImport} 
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg disabled:opacity-50"
                >
                    {loading ? 'Importing...' : 'Confirm & Import Data'}
                    <ArrowRight size={18} />
                </button>
            </div>
          </div>
      )}
    </div>
  );
}