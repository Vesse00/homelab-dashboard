'use client';

import { Globe, ShieldAlert, ExternalLink, Loader2, Activity, Link, Server } from 'lucide-react';

interface ProxyWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number; // Szerokość w jednostkach Grida
  h?: number; // Wysokość w jednostkach Grida
}

export default function ProxyWidget({ data, stats, isLoading, w = 2, h = 2 }: ProxyWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  // Zastosujemy efekt Glassmorphism (szkliste tło z rozmyciem)
  let bgClass = 'bg-slate-900/60 backdrop-blur-md border-slate-700/50';
  let iconColor = 'text-slate-500';

  if (isOnline) {
    bgClass = 'bg-emerald-950/40 backdrop-blur-md border-emerald-900/50';
    iconColor = 'text-emerald-500';
  } else if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
  }

  // Zmienna pomocnicza: czy kafelek jest "wysoki" (rozciągnięty)
  const isExpanded = h >= 4;

  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass}`}>
      
      {/* 1. GIGANTYCZNA IKONA W TLE (Nowoczesny efekt) */}
      <Globe 
        className={`absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} 
      />

      {/* 2. Kolorowa poświata w tle */}
      {isOnline && <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />}
      {isError && <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />}

      {/* --- NAGŁÓWEK KAFELKA --- */}
      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/5 ${iconColor} shadow-inner`}>
               <Globe size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">proxy-manager</span>
            </div>
         </div>
         <a href={data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-emerald-400 transition-colors p-1 bg-slate-950/30 rounded-lg">
            <ExternalLink size={14}/>
        </a>
      </div>

      {/* --- ZAWARTOSĆ GŁÓWNA --- */}
      <div className="flex-1 flex flex-col justify-end z-10 mt-2">
         {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono h-full justify-center">
              <Loader2 size={16} className="animate-spin" /> Ładowanie...
            </div>
         ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col h-full">
               
               {/* Główne statystyki */}
               <div>
                 <div className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md">
                   {stats?.primaryText || 'Brak danych'}
                 </div>
                 <div className="text-xs text-slate-400 font-mono mt-1 mb-4 flex items-center gap-1.5">
                   {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                   {stats?.secondaryText || 'Wymagana konfiguracja'}
                 </div>
               </div>

               {/* Małe kafelki (Zawsze widoczne na dole) */}
               {isOnline && (
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col backdrop-blur-sm transition-colors hover:bg-black/40">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1">
                         <Server size={12} className="text-emerald-400" /> Hosty
                       </span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.queries || 0}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col backdrop-blur-sm transition-colors hover:bg-black/40">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1">
                         <Activity size={12} className="text-emerald-400" /> Ping
                       </span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.latency || 0} ms</span>
                    </div>
                 </div>
               )}

               {/* ========================================================= */}
               {/* 3. WERSJA ROZSZERZONA (WIDOCZNA TYLKO GDY h >= 4)         */}
               {/* ========================================================= */}
               {isExpanded && isOnline && stats?.chartData && (
                 <div className="mt-4 pt-4 border-t border-white/10 flex-1 flex flex-col animate-in fade-in duration-500">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
                       Podział Hostów
                    </h4>
                    
                    {/* NASZ AUTORSKI WYKRES PASKOWY */}
                    <div className="flex-1 flex flex-col justify-center gap-3 relative z-20">
                       {stats.chartData.map((item: any, idx: number) => {
                          // Obliczamy szerokość paska w %
                          const percentage = stats.queries > 0 ? (item.count / stats.queries) * 100 : 0;
                          
                          return (
                             <div key={idx} className="w-full group/bar">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                   <span className="flex items-center gap-1.5">
                                      <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                      {item.label} 
                                      <span className="text-slate-600 normal-case">(Aktywne: {item.active})</span>
                                   </span>
                                   <span className="text-white bg-slate-900/50 px-1.5 py-0.5 rounded">{item.count}</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                   <div 
                                     className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] opacity-80 group-hover/bar:opacity-100`} 
                                     style={{ width: `${percentage}%` }} 
                                   />
                                </div>
                             </div>
                          )
                       })}
                    </div>
                 </div>
               )}

            </div>
         )}
      </div>
    </div>
  );
}