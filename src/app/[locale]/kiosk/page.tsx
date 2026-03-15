'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardGrid from '@/app/[locale]/components/DashboardGrid';
import { Loader2, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function KioskPage() {
  const [layout, setLayout] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const locale = useLocale();

  // Zegarek
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      const token = localStorage.getItem('kiosk_device_token');
      
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      try {
        const res = await fetch('/api/kiosk/layout', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setLayout(data.layout || []);
          setName(data.name || 'Ekran Ścienny');
        } else {
          setError('Nie udało się załadować widoku.');
        }
      } catch (e) {
        setError('Brak połączenia z serwerem.');
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center -mt-16 pt-16">
        <Loader2 className="animate-spin text-purple-500" size={64} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-center p-4 -mt-16 pt-16">
        <MonitorSmartphone className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" size={64} />
        <h1 className="text-3xl font-bold text-white mb-3">Błąd Kiosku</h1>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => {
            localStorage.removeItem('kiosk_device_token');
            router.push(`/${locale}/login`);
          }}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg"
        >
          Sparuj urządzenie ponownie
        </button>
      </div>
    );
  }

  return (
    // ZMIANA: -mt-16 wciąga ekran do góry, bg-transparent przepuszcza tło z layout.tsx
    <div className="min-h-screen bg-transparent p-4 flex flex-col overflow-hidden -mt-16 pt-6">
      
      {/* 🌟 Nagłówek Kiosku */}
      <div className="flex justify-between items-center mb-6 px-6 py-3 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <MonitorSmartphone className="text-purple-400" size={24} />
          </div>
          <span className="text-slate-200 font-bold text-lg tracking-wide">{name}</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* NOWE: Subtelny guzik odświeżania */}
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all active:rotate-180 duration-300"
            title="Odśwież Kiosk"
          >
            <RefreshCw size={22} />
          </button>

          {/* Zegar */}
          <div className="text-3xl font-black text-white tracking-widest font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-y-auto custom-scrollbar pr-2">
        <DashboardGrid 
          layout={layout} 
          onLayoutChange={() => {}} 
          isEditMode={false}        
          isAdmin={false}           
          onRemove={() => {}}
          onToggleLock={() => {}}
        />
      </div>
    </div>
  );
}