'use client';

import { Home, Lightbulb, Thermometer, Zap, ShieldCheck, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

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

  let bgClass = 'bg-slate-900/60 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';

  if (isError) {
    bgClass = 'bg-red-950/30 border-red-900/50';
    iconColor = 'text-red-500';
  } else if (isOnline) {
    bgClass = 'bg-blue-950/40 border-blue-900/50';
    iconColor = 'text-blue-400';
    glowClass = 'bg-blue-500/10';
  }

  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass} backdrop-blur-md`}>
      <Home className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />
      {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/5 shadow-inner ${iconColor}`}>
               <Home size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Home Assistant'}</span>
              <span className="text-[10px] text-slate-500 font-mono">smart-home-hub</span>
            </div>
         </div>
         <a href={data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 bg-slate-950/30 rounded-lg border border-white/5">
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
            
            {!isExpanded && (
              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 mt-auto shadow-inner">
                {isError ? (
                  <>
                    <span className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1.5"><AlertTriangle size={12}/> {stats?.primaryText || 'Błąd'}</span>
                    <span className="text-xs font-bold text-red-400 truncate max-w-[100px] text-right" title={stats?.secondaryText}>{stats?.secondaryText}</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5"><Home size={12}/> Offline</span>
                    <span className="text-xs font-bold text-slate-500 truncate" title={stats?.secondaryText}>{stats?.secondaryText || 'Brak połączenia'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-blue-400"/> {stats?.primaryText || 'Status systemu'}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 truncate max-w-[100px] text-right" title={stats?.secondaryText}>
                      {stats?.secondaryText || 'ONLINE'}
                    </span>
                  </>
                )}
              </div>
            )}

            {isExpanded && (
              <div className="mt-4 flex-1 flex flex-col justify-end animate-in fade-in duration-500 gap-3">
                {isError || !isOnline ? (
                  <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl p-3 text-center ${isError ? 'border-red-500/30 bg-red-500/5' : 'border-slate-500/30 bg-slate-500/5'}`}>
                    {isError ? <AlertTriangle size={28} className="text-red-500 mb-2" /> : <Home size={28} className="text-slate-500 mb-2" />}
                    <span className="text-sm font-bold text-white mb-1">{stats?.primaryText || 'Brak połączenia'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isError ? 'text-red-400' : 'text-slate-400'}`}>{stats?.secondaryText || 'Sprawdź adres URL'}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-blue-500/30 bg-blue-500/5 rounded-xl p-3 text-center">
                      <span className="text-xs text-slate-300 mb-1">Status integracji:</span>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{stats?.secondaryText || 'Wymaga Tokenu API HA'}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 opacity-30 grayscale pointer-events-none">
                      <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-inner">
                        <Lightbulb size={16} className="text-yellow-400" />
                        <span className="text-white font-black text-sm">-</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Światła</span>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-inner">
                        <Thermometer size={16} className="text-orange-400" />
                        <span className="text-white font-black text-sm">-</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Temperatura</span>
                      </div>
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