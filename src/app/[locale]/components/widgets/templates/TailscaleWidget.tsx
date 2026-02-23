'use client';

import { Network, ShieldCheck, Loader2, ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TailscaleWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function TailscaleWidget({ data, stats, isLoading, w = 2, h = 2 }: TailscaleWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  const isExpanded = w >= 3 && h >= 3;
  const devicesCount = stats?.devices ?? 0;

  // Domyślne kolory
  let bgClass = 'bg-slate-900/60 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';
  let TopIcon = Network;

  if (isOnline) {
    bgClass = 'bg-blue-950/40 backdrop-blur-md border-blue-900/50';
    iconColor = 'text-blue-500';
    glowClass = 'bg-blue-500/10';
    TopIcon = Network;
  } else if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
    TopIcon = ShieldAlert;
  }

  // --- WIDOK KOMPAKTOWY (h = 1) ---
  if (h === 1) {
    return (
      <div className={`h-full w-full border flex items-center justify-between px-4 relative overflow-hidden transition-all duration-300 shadow-xl ${bgClass} rounded-2xl`}>
        {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-24 h-24 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}
        <div className="flex items-center gap-3 z-10">
          <div className={`p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
             <TopIcon size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Tailscale'}</span>
            <span className={`text-[10px] font-mono ${isError ? 'text-red-400' : 'text-blue-400'}`}>{isError ? 'Offline' : 'Sieć Mesh'}</span>
          </div>
        </div>
        <div className="z-10 flex items-center gap-2">
          {isError ? (
             <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Błąd</span>
          ) : (
             <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Węzły</span>
                <span className="text-sm font-black text-white">{devicesCount}</span>
             </div>
          )}
          <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5 ml-2">
             <ExternalLink size={14}/>
          </a>
        </div>
      </div>
    );
  }

  // --- WIDOK NORMALNY (h >= 2) ---
  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass} rounded-2xl`}>
      <Network className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />
      {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <TopIcon size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Tailscale'}</span>
              <span className={`text-[10px] font-mono ${iconColor}`}>mesh-vpn</span>
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

            {isOnline && !isExpanded && (
              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 mt-auto shadow-inner">
                 <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                   <ShieldCheck size={12} className="text-blue-500"/> {stats?.primaryText || 'Połączono'}
                 </span>
                 <span className="text-xs font-black text-white font-mono">
                   {devicesCount > 0 ? devicesCount : '-' } <span className="text-slate-500">węzłów</span>
                 </span>
              </div>
            )}

            {isOnline && isExpanded && (
               <div className="mt-4 flex-1 flex flex-col justify-end gap-3">
                  <div className="flex justify-between items-center px-2">
                     <span className="text-xs text-slate-400 uppercase font-bold">Urządzenia w sieci</span>
                     <span className="text-2xl font-black text-white">{devicesCount}</span>
                  </div>
               </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}