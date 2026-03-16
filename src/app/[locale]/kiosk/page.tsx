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

  // Dodajemy stan, który będzie informował, czy kiosk jest w trybie "Czekania"
  const [isWaiting, setIsWaiting] = useState(false);

  // Zegarek
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  
  // --- ZMIENNE STANU DLA PODSTRON (zastępują stare `const [layout, setLayout]`) ---
  const [allTabs, setAllTabs] = useState<any[]>([]); 
  const [kioskTabId, setKioskTabId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  // Zostawiasz też swoje setLoading i setError...

  useEffect(() => {
    if (!isWaiting) return;
    const interval = setInterval(() => {
      window.location.reload();
    }, 5000); // Sprawdza co 5 sekund
    return () => clearInterval(interval);
  }, [isWaiting]);

  // --- POBIERANIE UKŁADU I INFORMACJI O KIOSKU ---
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
          
          // JEŚLI SERWER ZGŁASZA, ŻE JESTEŚMY W POCZEKALNI:
          if (data.isWaiting) {
            setIsWaiting(true);
            setName(data.name || 'Ekran Ścienny');
            setLoading(false);
            return; // Przerywamy dalsze ładowanie widgetów
          }

          // W PRZECIWNYM RAZIE ŁADUJEMY NORMALNIE:
          setIsWaiting(false);
          setAllTabs(data.allTabs || []);
          setKioskTabId(data.tabId || null);
          setName(data.name || 'Ekran Ścienny');

          if (!activeTabId && data.tabId) {
            setActiveTabId(data.tabId);
          }
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
  }, [locale, router, activeTabId]); // Pamiętaj dodać activeTabId do tablicy zależności!

  // --- MAGIA OBLICZEŃ (Umieść to tuż przed return (...)) ---
  
  // 1. Kiosk wybiera z całej bazy tylko te zakładki, które są jego (Główna + Podstrony)
  const devicePages = allTabs.filter(t => t.id === kioskTabId || t.parentId === kioskTabId);
  
  // 2. Kiosk wyciąga widgety TYLKO dla tej strony, w którą akurat kliknąłeś na dolnym pasku
  const activeWidgets = allTabs.find(t => t.id === activeTabId)?.widgets || [];

  

  // --- AUTOMATYCZNE WYKRYWANIE I WYSYŁANIE WYMIARÓW EKRANU ---
  useEffect(() => {
    const syncDimensions = async () => {
      const token = localStorage.getItem('kiosk_device_token');
      if (!token) return;

      // Pobieramy wymiary LOGICZNE (te, które widzi CSS)
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = window.devicePixelRatio;

      try {
        await fetch('/api/kiosk/dimensions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ width, height, ratio })
        });
      } catch (err) {
        console.error("Nie udało się zsynchronizować wymiarów ekranu", err);
      }
    };

    // Odpalamy po załadowaniu
    syncDimensions();

    // Opcjonalnie: odpalamy ponownie, gdy ktoś obróci ekran telefonu!
    window.addEventListener('resize', syncDimensions);
    return () => window.removeEventListener('resize', syncDimensions);
  }, []);

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

  // --- WIDOK POCZEKALNI ---
  if (isWaiting) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 -mt-16 pt-16">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-500">
          
          <div className="w-20 h-20 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-500/20">
             <MonitorSmartphone size={40} />
          </div>
          
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest">{name}</h1>
          
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-6">
            <span className="text-emerald-400 font-bold text-sm">Sparowano pomyślnie!</span>
          </div>
          
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Urządzenie poprawnie zautoryzowane na Twoim koncie. Czeka na przypisanie pulpitu przez Administratora w ustawieniach systemu.
          </p>
          
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-slate-500 animate-spin" />
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Oczekiwanie...</span>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    // ZMIANA: -mt-16 wciąga ekran do góry, bg-transparent przepuszcza tło z layout.tsx
    <div className="min-h-screen bg-transparent p-4 flex flex-col overflow-hidden -mt-16 pt-6">
      
      {/* 🌟 ELEGANCKI PASEK NAWIGACYJNY (NAGŁÓWEK + ZAKŁADKI) */}
      <div className="w-full px-4 pt-4 mb-6 z-40 relative">
        <div className="flex flex-col gap-4 bg-slate-900/50 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-700/50 shadow-2xl">
          
          {/* WIERSZ 1: Tytuł Kiosku (Lewo) i Odświeżenie (Prawo) */}
          <div className="flex items-center justify-between w-full">
            
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-purple-500/20 rounded-xl shadow-inner hidden sm:flex border border-purple-500/20">
                <MonitorSmartphone size={20} className="text-purple-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow-md">
                {name}
              </h1>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="p-2 sm:px-4 sm:py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all flex items-center gap-2 group shadow-sm shrink-0"
              title="Odśwież Kiosk"
            >
              <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500 text-slate-400 group-hover:text-white" />
              <span className="hidden sm:block text-sm font-bold">Odśwież</span>
            </button>

          </div>

          {/* WIERSZ 2: Zakładki / Podstrony (Tylko jeśli są podstrony) */}
          {devicePages.length > 1 && (
            <div className="flex flex-col gap-3">
              {/* Delikatny separator oddzielający tytuł od stron */}
              <div className="w-full h-px bg-slate-700/50 rounded-full" />
              
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {devicePages.map((page) => {
                  const isActive = activeTabId === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActiveTabId(page.id)}
                      className={`
                        relative flex items-center justify-center px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border
                        ${isActive 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                          : 'bg-slate-800/40 text-slate-400 border-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600/50 shadow-sm'
                        }
                      `}
                    >
                      {page.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="flex-1 w-full relative overflow-y-auto custom-scrollbar pr-2">
        <DashboardGrid 
          layout={activeWidgets} 
          onLayoutChange={() => {}} 
          isEditMode={false}        
          isAdmin={false}           
          onRemove={() => {}}
          onToggleLock={() => {}}
          isKiosk={true}
        />
        
      </div>
      
    </div>
  );
}