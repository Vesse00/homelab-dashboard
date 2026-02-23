'use client';

import { Activity, CheckCircle2, AlertCircle, AlertTriangle, Loader2, ExternalLink, Globe, ShieldAlert } from 'lucide-react';

interface UptimeKumaWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function UptimeKumaWidget({ data, stats, isLoading, w = 2, h = 2 }: UptimeKumaWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  // Widget rozwija się, gdy pociągniemy go w dół
  const isExpanded = h >= 3;

  const upCount = stats?.up ?? 0;
  const downCount = stats?.down ?? 0;
  const total = upCount + downCount;
  const hasData = total > 0;
  const isAllGood = downCount === 0;

  const monitors = stats?.monitors || [];
  const upPercent = total > 0 ? Math.round((upCount / total) * 100) : 0;

  // --- DYNAMICZNY SYSTEM KOLUMN I LIMITÓW ---
  // Obliczamy ile monitorów zmieści się w pionie (ok. 3-4 na każdą jednostkę wysokości powyżej 2)
  // Zwiększyliśmy lekko mnożnik, bo elementy są teraz mniejsze
  const rowsCount = 3 + (h - 3) * 3;
  const isMultiColumn = w >= 3;
  const colsCount = isMultiColumn ? 2 : 1;
  
  const maxVisible = rowsCount * colsCount;
  const visibleMonitors = monitors.slice(0, maxVisible);
  const hiddenCount = monitors.length - maxVisible;

  let bgClass = 'bg-slate-900/60 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';

  if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
  } else if (isOnline) {
    if (hasData && !isAllGood) {
      bgClass = 'bg-orange-950/30 border-orange-900/50';
      iconColor = 'text-orange-500';
      glowClass = 'bg-orange-500/10';
    } else {
      bgClass = 'bg-emerald-950/30 border-emerald-900/50';
      iconColor = 'text-emerald-500';
      glowClass = 'bg-emerald-500/10';
    }
  }

  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass} backdrop-blur-md`}>
      <Activity className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />
      {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <Activity size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Uptime Kuma'}</span>
              <span className="text-[10px] text-slate-500 font-mono">monitor-status</span>
            </div>
         </div>
         <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-emerald-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5">
            <ExternalLink size={14}/>
        </a>
      </div>

      <div className="flex-1 flex flex-col justify-end z-10 mt-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono h-full justify-center">
            <Loader2 size={16} className="animate-spin" /> Ładowanie...
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col h-full justify-end">
            
            {/* TRYB KOMPAKTOWY (1x2 lub 2x2) */}
            {!isExpanded && (
              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 mt-auto shadow-inner">
                {isError ? (
                  <>
                    <span className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1.5"><AlertTriangle size={12}/> {stats?.primaryText || 'Błąd'}</span>
                    <span className="text-xs font-bold text-red-400 truncate max-w-[100px] text-right" title={stats?.secondaryText}>{stats?.secondaryText}</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5"><Activity size={12}/> Offline</span>
                    <span className="text-xs font-bold text-slate-500 truncate" title={stats?.secondaryText}>{stats?.secondaryText || 'Brak połączenia'}</span>
                  </>
                ) : hasData ? (
                  <>
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      {isAllGood ? <CheckCircle2 size={12} className="text-emerald-500"/> : <AlertCircle size={12} className="text-orange-500"/>} Stan
                    </span>
                    <span className="text-xs font-black text-white font-mono">
                      <span className={isAllGood ? "text-emerald-400" : "text-orange-400"}>{upCount}</span> / {total}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5"><Activity size={12} className="text-blue-400"/> Połączono</span>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px] text-right" title={stats?.secondaryText}>{stats?.secondaryText}</span>
                  </>
                )}
              </div>
            )}

            {/* TRYB ROZSZERZONY (Ciągnięcie w dół: h >= 3) */}
            {isExpanded && (
              <div className="mt-2 flex-1 flex flex-col animate-in fade-in duration-500 gap-2 overflow-hidden">
                {isError || (!isOnline) ? (
                  <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl p-3 text-center ${isError ? 'border-red-500/30 bg-red-500/5' : 'border-slate-500/30 bg-slate-500/5'}`}>
                    {isError ? <AlertTriangle size={28} className="text-red-500 mb-2" /> : <Activity size={28} className="text-slate-500 mb-2" />}
                    <span className="text-sm font-bold text-white mb-1">{stats?.primaryText || 'Brak połączenia'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isError ? 'text-red-400' : 'text-slate-400'}`}>{stats?.secondaryText || 'Sprawdź adres URL'}</span>
                  </div>
                ) : (
                  <>
                    {/* Zmniejszono mb-2 na mb-1 i pb-3 na pb-2 dla oszczędności miejsca */}
                    <div className="flex flex-col mb-1 border-b border-white/10 pb-2 shrink-0">
                       <div className="flex justify-between items-end">
                         <div>
                           <p className="text-2xl font-black text-white leading-none">{upCount} <span className="text-sm font-bold text-slate-500">/ {hasData ? total : '0'}</span></p>
                           <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Usługi Online</p>
                         </div>
                         <div className="text-right">
                           <p className={`text-lg font-black leading-none ${hasData ? (isAllGood ? 'text-emerald-400' : 'text-orange-400') : 'text-slate-400'}`}>
                             {hasData ? `${upPercent}%` : 'PUSTO'}
                           </p>
                           <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{stats?.secondaryText || 'Status Globalny'}</p>
                         </div>
                       </div>
                       
                       {/* Zmniejszono margin-top paska */}
                       {hasData && (
                         <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                           <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${upPercent}%` }} />
                           <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${100 - upPercent}%` }} />
                         </div>
                       )}
                    </div>

                    {/* Lista monitorów - Zmniejszono odstępy (space-y-1 i gap-1.5) */}
                    <div className={`flex-1 overflow-y-auto pr-1 custom-scrollbar content-start ${isMultiColumn ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col space-y-1'}`}>
                       {monitors.length > 0 ? (
                         <>
                           {visibleMonitors.map((m: any, idx: number) => (
                             // Zmniejszono padding z p-2 na p-1.5
                             <div key={idx} className="flex justify-between items-center bg-black/20 hover:bg-black/40 transition-colors p-1.5 rounded-lg border border-white/5">
                               <span className="text-xs text-slate-300 font-bold flex items-center gap-2 truncate pr-2">
                                 <Globe size={12} className={`shrink-0 ${m.status === 1 ? "text-emerald-400" : "text-orange-400"}`}/> 
                                 <span className="truncate">{m.name}</span>
                               </span>
                               <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${m.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                 {m.status === 1 ? 'Online' : 'Offline'}
                               </span>
                             </div>
                           ))}
                           
                           {/* Przycisk informujący o ukrytych monitorach - Zmniejszono padding */}
                           {hiddenCount > 0 && (
                             <div className={`flex justify-center items-center bg-black/10 p-1.5 rounded-lg border border-dashed border-white/10 ${isMultiColumn ? 'col-span-2' : ''}`}>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                 Powiększ aby zobaczyć więcej (+{hiddenCount})
                               </span>
                             </div>
                           )}
                         </>
                       ) : (
                         <div className={`h-full flex flex-col items-center justify-center text-center p-2 opacity-50 ${isMultiColumn ? 'col-span-2' : ''}`}>
                            <AlertCircle size={20} className="mb-2 text-slate-400" />
                            <span className="text-xs text-slate-300">Brak monitorów.</span>
                            <span className="text-[9px] text-slate-400 mt-1">Dodaj monitory do grupy na stronie statusu w panelu Uptime Kuma.</span>
                         </div>
                       )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}