'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface SettingsType {
  country: string;
  currency: string;
  currencySymbol: string;
  decimals: number;
  isLoading: boolean;
  refreshSettings: () => void;
  formatAmount: (amount: number | string) => string;
  showAlert: (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (title: string, text: string, onConfirm: () => void) => void;
}

const SettingsContext = createContext<SettingsType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    country: 'US',
    currency: 'USD',
    currencySymbol: '$',
    decimals: 2
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Settings from API
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSettings({
            country: data.country || 'US',
            currency: data.currency || 'USD',
            currencySymbol: data.currency_symbol || '$',
            decimals: data.decimals ?? 2
          });
        }
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Helper: Format Money (e.g. $1,200.00)
  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${settings.currencySymbol}0.${'0'.repeat(settings.decimals)}`;
    
    return settings.currencySymbol + num.toLocaleString('en-US', {
      minimumFractionDigits: settings.decimals,
      maximumFractionDigits: settings.decimals
    });
  };

  // Helper: SweetAlert Toast (Non-blocking notification)
  const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
    MySwal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: icon,
      title: title,
      text: text,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  // Helper: Confirmation Dialog (Blocking)
  const showConfirm = (title: string, text: string, onConfirm: () => void) => {
    MySwal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0891b2', // Cyan-600
      cancelButtonColor: '#e11d48',  // Rose-600
      confirmButtonText: 'Yes, proceed!'
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      ...settings, 
      isLoading, 
      refreshSettings: fetchSettings, 
      formatAmount,
      showAlert,
      showConfirm 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};