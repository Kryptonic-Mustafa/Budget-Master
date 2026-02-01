'use client'; 

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { LayoutDashboard, Wallet, ArrowRightLeft, LogOut, BarChart2, PieChart, RefreshCw, Target, Upload, Activity, Settings } from 'lucide-react';
// IMPORT SETTINGS PROVIDER
import { SettingsProvider } from '@/context/SettingsContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); 

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/portal');
      router.refresh(); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <SettingsProvider> {/* WRAP EVERYTHING HERE */}
        <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col relative z-20">
            <div className="p-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                BudgetMaster
            </h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <NavItem href="/overview" icon={<LayoutDashboard size={20} />} label="Overview" />
                <NavItem href="/accounts" icon={<Wallet size={20} />} label="Accounts" />
                <NavItem href="/transactions" icon={<ArrowRightLeft size={20} />} label="Transactions" />
                <NavItem href="/reports" icon={<BarChart2 size={20} />} label="Reports" />
                <NavItem href="/budgets" icon={<PieChart size={20} />} label="Budgets" />
                <NavItem href="/recurring" icon={<RefreshCw size={20} />} label="Recurring" />
                <NavItem href="/goals" icon={<Target size={20} />} label="Goals" />
                <NavItem href="/import" icon={<Upload size={20} />} label="Import CSV" />
                <NavItem href="/activity" icon={<Activity size={20} />} label="Activity Log" />
                <div className="border-t border-white/10 my-2 pt-2">
                    <NavItem href="/settings" icon={<Settings size={20} />} label="Settings" />
                </div>
            </nav>

            <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-300 group">
                <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Sign Out</span>
            </button>
            </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative z-10">
            <div className="p-8 max-w-7xl mx-auto">
            {children}
            </div>
        </main>
        </div>
    </SettingsProvider>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-lg transition-all duration-300">
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}