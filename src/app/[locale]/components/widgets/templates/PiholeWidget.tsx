'use client';

import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Loader2, Activity, Globe, CheckCircle2, Ban } from 'lucide-react';

interface PiholeWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function PiholeWidget({ data, stats, isLoading, w = 2, h = 2 }: PiholeWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  let bgClass = 'bg-slate-900/60 backdrop-blur-md border-slate-700/50';
  let iconColor = 'text-slate-500';
  let Icon = Shield;

  if (isOnline) {
    bgClass = 'bg-emerald-950/40 backdrop-blur-md border-emerald-900/50';
    iconColor = 'text-emerald-500';
    Icon = ShieldCheck;
  } else if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
    Icon = ShieldAlert;
  }

  const isExpanded = w >= 3 && h >= 3;

  // Obliczenia do wykresu kolistego
  const blockedCount = stats?.primaryText ? parseInt(stats.primaryText.replace(/\D/g, '')) || 0 : 0;
  const totalQueries = stats?.queries || 1; // Unikamy dzielenia przez zero
  const allowedCount = Math.max(0, totalQueries - blockedCount);
  
  // Obliczamy procent zablokowanych (żeby wiedzieć, gdzie kończy się gradient)
  const blockedPercent = totalQueries > 0 ? Math.round((blockedCount / totalQueries) * 100) : 0;
  // Czysty CSS do narysowania wykresu: Czerwony dla zablokowanych, Zielony dla przepuszczonych
  const chartGradient = `conic-gradient(#ef4444 ${blockedPercent}%, #10b981 0)`;

  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass}`}>
      
      <Icon className={`absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} />
      {isOnline && <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/5 ${iconColor} shadow-inner`}>
               <Icon size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">dns-sinkhole</span>
            </div>
         </div>
         <a href={data.clickUrl || data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className={`p-1.5 bg-black/30 rounded-lg border border-white/5 transition-colors z-20 ${isOnline ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <ExternalLink size={14}/>
        </a>
      </div>

      <div className="flex-1 flex flex-col justify-end z-10 mt-2">
         {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono h-full justify-center">
              <Loader2 size={16} className="animate-spin" /> Ładowanie...
            </div>
         ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col h-full">
               
               <div>
                 <div className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md">
                   {stats?.primaryText || 'Brak danych'}
                 </div>
                 <div className="text-xs text-slate-400 font-mono mt-1 mb-4">
                   {stats?.secondaryText || 'Wymagana konfiguracja'}
                 </div>
               </div>

               {isOnline && !isExpanded && (
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Globe size={12} className="text-blue-400" /> Zapytania</span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.queries?.toLocaleString()}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Activity size={12} className="text-emerald-400" /> Ping</span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.processingTime || 'N/A'} ms</span>
                    </div>
                 </div>
               )}

               {/* ========================================================= */}
               {/* 3. WERSJA ROZSZERZONA (WYKRES KOLISTY)                    */}
               {/* ========================================================= */}
               {isExpanded && isOnline && (
                 <div className="mt-2 pt-4 border-t border-white/10 flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
                    
                    <div className="flex items-center justify-center gap-6 w-full px-2">
                       {/* LEWA STRONA: Wykres z czystego CSS */}
                       <div className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ background: chartGradient }}>
                          {/* Wewnętrzne koło (tworzy dziurę w pączku) */}
                          <div className="w-20 h-20 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                             <span className="text-xs text-slate-400 font-bold">Bloki</span>
                             <span className="text-lg font-black text-white">{blockedPercent}%</span>
                          </div>
                       </div>

                       {/* PRAWA STRONA: Legenda */}
                       <div className="flex flex-col gap-3 flex-1">
                          <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                             <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-0.5"><CheckCircle2 size={10} className="text-emerald-500"/> Przepuszczone</span>
                             <span className="text-sm text-white font-mono font-bold">{allowedCount.toLocaleString()}</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                             <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-0.5"><Ban size={10} className="text-red-500"/> Zablokowane</span>
                             <span className="text-sm text-white font-mono font-bold">{blockedCount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                 </div>
               )}

            </div>
         )}
      </div>
    </div>
  );
}