'use client';

import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, FileText, Trash2, LogIn, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  const getIcon = (action: string) => {
    if (action.includes('LOGIN')) return <LogIn size={18} className="text-emerald-400" />;
    if (action.includes('LOGOUT')) return <ShieldCheck size={18} className="text-slate-400" />;
    if (action.includes('DELETE')) return <Trash2 size={18} className="text-rose-400" />;
    if (action.includes('CREATE')) return <PlusCircle size={18} className="text-blue-400" />;
    return <FileText size={18} className="text-slate-400" />;
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">System Logs</h1>
        <p className="text-slate-400">Track account security and actions.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-white/10"></div>

        <div className="space-y-8">
            {loading ? (
                <div className="text-center text-slate-500 py-10">Loading logs...</div>
            ) : logs.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No recent activity.</div>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className="relative flex items-start gap-4 group">
                        <div className="z-10 bg-slate-900 border border-white/20 p-2 rounded-full shadow-lg group-hover:border-cyan-500 transition-colors">
                            {getIcon(log.action)}
                        </div>
                        <div className="flex-1 bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white text-sm">{log.action.replace('_', ' ')}</h3>
                                <span className="text-xs text-slate-500 font-mono">
                                    {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">{log.details}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}