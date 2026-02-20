'use client';

import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Loader2, Activity, Globe } from 'lucide-react';

interface PiholeWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
}

export default function PiholeWidget({ data, stats, isLoading }: PiholeWidgetProps) {
  
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  let bgClass = 'bg-slate-800 border-slate-700';
  let iconColor = 'text-slate-500';
  let Icon = Shield;

  if (isOnline) {
    bgClass = 'bg-emerald-950/30 border-emerald-900/50';
    iconColor = 'text-emerald-500';
    Icon = ShieldCheck;
  } else if (isError) {
    bgClass = 'bg-red-950/30 border-red-900/50';
    iconColor = 'text-red-500';
    Icon = ShieldAlert;
  }

  return (
    <div className={`h-full w-full border flex flex-col p-4 relative overflow-hidden transition-colors ${bgClass}`}>
      
      {/* Tło i poświata */}
      {isOnline && <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />}
      {isError && <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />}

      {/* Nagłówek */}
      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 ${iconColor} shadow-inner`}>
               <Icon size={20} />
            </div>
            <span className="font-bold text-slate-200">{data.name}</span>
         </div>
         <a href={data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-white transition-colors p-1">
            <ExternalLink size={14}/>
        </a>
      </div>

      {/* Główna sekcja danych */}
      <div className="flex-1 flex flex-col justify-end z-10 mt-2">
         {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono h-full justify-center">
              <Loader2 size={14} className="animate-spin" /> Ładowanie...
            </div>
         ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="text-lg font-bold text-white tracking-tight leading-none">
                 {stats?.primaryText || 'Brak danych'}
               </div>
               <div className="text-xs text-slate-400 font-mono mt-1 mb-3">
                 {stats?.secondaryText || 'Wymagana konfiguracja'}
               </div>

               {/* Małe kafelki z dodatkowymi statystykami */}
               {isOnline && (
                 <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-black/20 border border-white/5 rounded-lg p-2 flex flex-col">
                       <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-0.5">
                         <Globe size={10} className="text-blue-400" /> Zapytania
                       </span>
                       <span className="text-sm text-white font-mono">{stats?.queries?.toLocaleString() || 0}</span>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-lg p-2 flex flex-col">
                       <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-0.5">
                         <Activity size={10} className="text-emerald-400" /> Ping
                       </span>
                       <span className="text-sm text-white font-mono">{stats?.latency || 0} ms</span>
                    </div>
                 </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
}