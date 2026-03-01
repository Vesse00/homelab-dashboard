'use client';

import { Home, ShieldCheck, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

interface HomeAssistantWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function HomeAssistantWidget({ data, stats, isLoading, w = 2, h = 2 }: HomeAssistantWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  const isExpanded = w >= 3 && h >= 3;

  // Statystyki encji wyciągnięte z API
  const entities = stats?.entities || { total: 0, on: 0, off: 0, unavailable: 0 };
  const onPercent = entities.total > 0 ? (entities.on / entities.total) * 100 : 0;
  const offPercent = entities.total > 0 ? (entities.off / entities.total) * 100 : 0;

  // Domyślne kolory
  let bgClass = 'bg-slate-900/60 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';
  let TopIcon = Home;

  if (isOnline) {
    bgClass = 'bg-blue-950/40 backdrop-blur-md border-blue-900/50';
    iconColor = 'text-blue-500';
    glowClass = 'bg-blue-500/10';
    TopIcon = Home;
  } else if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
    TopIcon = AlertTriangle;
  }

  // --- WIDOK KOMPAKTOWY (h = 1) ---
  if (h === 1) {
    return (
      <div className={`h-full w-full border flex items-center justify-between px-4 relative overflow-hidden transition-all duration-300 shadow-xl ${bgClass} rounded-2xl`}>
        <div className="flex items-center gap-3 z-10">
          <div className={`p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
             <TopIcon size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Home Assistant'}</span>
            <span className={`text-[10px] font-mono ${isError ? 'text-red-400' : 'text-blue-400'}`}>{isError ? 'Offline' : 'Smart Home'}</span>
          </div>
        </div>
        <div className="z-10 flex items-center gap-2">
          {isError ? (
             <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Błąd</span>
          ) : (
             <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-950 shadow-[0_0_5px_#73fb24]"></span>
                <span className="text-sm font-black text-white">{entities.on > 0 ? entities.on : '-'} <span className="text-[10px] text-slate-400 font-normal">Wł.</span></span>
             </div>
          )}
          <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5 ml-2">
             <ExternalLink size={14}/>
          </a>
        </div>
      </div>
    );
  }

  // --- WIDOK NORMALNY I ROZSZERZONY Z WYKRESEM (h >= 2) ---
  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass} rounded-2xl`}>
      <Home className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />
      {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <TopIcon size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Home Assistant'}</span>
              <span className={`text-[10px] font-mono ${iconColor}`}>smart-home-hub</span>
            </div>
         </div>
         <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5">
            <ExternalLink size={14}/>
        </a>
      </div>

      <div className="flex-1 flex flex-col justify-end z-10 mt-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono h-full justify-center">
            <Loader2 size={16} className="animate-spin" /> Ładowanie...
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col h-full justify-end">
            
            {isError && (
              <div className="mt-auto mb-2">
                 <div className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md">
                   {stats?.primaryText || 'Brak danych'}
                 </div>
                 <div className="text-xs text-slate-400 font-mono mt-1">
                   {stats?.secondaryText || 'Wymagana konfiguracja'}
                 </div>
              </div>
            )}

            {/* Zmodyfikowany widok online - Pasek Urządzeń zamiast tekstowego podsumowania */}
            {isOnline && (
              <div className="mt-auto">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-black text-white leading-none">{entities.total > 0 ? entities.total : '?'} <span className="text-xs font-bold text-slate-400">Urządzeń</span></span>
                 </div>
                 
                 {/* Mini-wykres paskowy */}
                 {entities.total > 0 ? (
                   <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex mb-2 shadow-inner border border-white/5">
                      <div className="h-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" style={{ width: `${onPercent}%` }}></div>
                      <div className="h-full bg-slate-500" style={{ width: `${offPercent}%` }}></div>
                   </div>
                 ) : (
                   <div className="text-[10px] text-slate-500 mb-2 truncate">{stats?.secondaryText || 'ONLINE'}</div>
                 )}

                 {/* Pełna legenda w widoku rozszerzonym (3x3) */}
                 {isExpanded && entities.total > 0 && (
                   <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
                      <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Włączone</span>
                        <span className="text-sm text-amber-400 font-black">{entities.on}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Wyłączone</span>
                        <span className="text-sm text-slate-300 font-black">{entities.off}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Brak odp.</span>
                        <span className="text-sm text-red-400 font-black">{entities.unavailable}</span>
                      </div>
                   </div>
                 )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}