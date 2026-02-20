'use client';

import { Box, ServerCrash, ExternalLink, Loader2, Activity, Layers, Play, Square } from 'lucide-react';

interface AdminWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function AdminWidget({ data, stats, isLoading, w = 2, h = 2 }: AdminWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  let bgClass = 'bg-slate-900/60 backdrop-blur-md border-slate-700/50';
  let iconColor = 'text-slate-500';
  let Icon = Box;

  if (isOnline) {
    bgClass = 'bg-blue-950/30 backdrop-blur-md border-blue-900/50';
    iconColor = 'text-blue-500';
  } else if (isError) {
    bgClass = 'bg-red-950/30 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
    Icon = ServerCrash;
  }

  const isExpanded = w >= 3 && h >= 3;

  // Wyciągamy liczby ze stringów z Tłumacza API (np. "Działa: 14" -> 14)
  const running = stats?.primaryText ? parseInt(stats.primaryText.replace(/\D/g, '')) || 0 : 0;
  const stopped = stats?.secondaryText ? parseInt(stats.secondaryText.replace(/\D/g, '')) || 0 : 0;
  const total = stats?.queries || (running + stopped) || 1;
  const runningPercent = Math.round((running / total) * 100);

  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass}`}>
      
      <Icon className={`absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${isOnline ? 'text-blue-400' : 'text-slate-400'}`} />
      {isOnline && <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />}
      {isError && <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/5 ${iconColor} shadow-inner`}>
               <Icon size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">admin-panel</span>
            </div>
         </div>
         <a href={data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-blue-400 transition-colors p-1 bg-slate-950/30 rounded-lg">
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
                 <div className="text-xs text-slate-400 font-mono mt-1 mb-4 flex items-center gap-1.5">
                   {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                   {stats?.secondaryText || 'Wymagana konfiguracja'}
                 </div>
               </div>

               {isOnline && !isExpanded && (
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1"><Layers size={12} className="text-blue-400" /> Razem</span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.queries || 0}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1"><Activity size={12} className="text-blue-400" /> Ping</span>
                       <span className="text-sm text-white font-mono font-bold">{stats?.latency || 0} ms</span>
                    </div>
                 </div>
               )}

               {/* WERSJA ROZSZERZONA */}
               {isExpanded && isOnline && (
                 <div className="mt-4 pt-4 border-t border-white/10 flex-1 flex flex-col animate-in fade-in duration-500 justify-end">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-2">Stan Środowiska</h4>
                    
                    <div className="flex justify-between items-end mb-2">
                       <div className="flex items-center gap-2">
                          <Play size={14} className="text-blue-400" />
                          <span className="text-xl font-black text-white">{runningPercent}%</span>
                       </div>
                       <span className="text-xs text-slate-400 font-bold font-mono">Razem: {total}</span>
                    </div>

                    <div className="w-full h-4 bg-slate-800 rounded-full flex overflow-hidden border border-white/5 shadow-inner">
                       <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${runningPercent}%` }} />
                       <div className="h-full bg-slate-600 transition-all duration-1000" style={{ width: `${100 - runningPercent}%` }} />
                    </div>

                    <div className="flex justify-between mt-2 px-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <span>Działa ({running})</span>
                       <span>Zatrzymane ({stopped})</span>
                    </div>
                 </div>
               )}

            </div>
         )}
      </div>
    </div>
  );
}