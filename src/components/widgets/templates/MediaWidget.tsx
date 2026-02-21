'use client';

import { Play, Clapperboard, ExternalLink, Loader2, PlayCircle, Film, Tv } from 'lucide-react';

interface MediaWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function MediaWidget({ data, stats, isLoading, w = 2, h = 2 }: MediaWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';
  
  // Plex = Pomarańczowy, Jellyfin = Fioletowy
  const colorBase = data.color === 'orange' ? 'orange' : 'purple';
  const activeStreams = stats?.queries || 0;
  const counts = stats?.mediaCounts || { MovieCount: 0, SeriesCount: 0, EpisodeCount: 0 };
  
  let bgClass = 'bg-slate-800 border-slate-700';
  let iconColor = 'text-slate-500';
  const Icon = data.icon === 'Play' ? Play : Clapperboard;

  if (isOnline) {
    bgClass = colorBase === 'orange' ? 'bg-orange-950/30 border-orange-900/50' : 'bg-purple-950/30 border-purple-900/50';
    iconColor = colorBase === 'orange' ? 'text-orange-500' : 'text-purple-500';
  } else if (isError) {
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
  }

  // --- WIDOK KOMPAKTOWY (h = 1) ---
  if (h === 1) {
    return (
      <div className={`h-full w-full border flex items-center justify-between px-4 relative overflow-hidden transition-all duration-300 shadow-xl ${bgClass} rounded-2xl group cursor-pointer hover:border-${colorBase}-500/30`}>
        {isOnline && <div className={`absolute -left-10 -top-10 w-24 h-24 blur-3xl rounded-full pointer-events-none bg-${colorBase}-500/10`} />}
        
        <div className="flex items-center gap-3 z-10 flex-1 min-w-0 mr-3">
          <div className={`shrink-0 p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
             <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-200 text-sm block leading-tight truncate">{data.name}</span>
            <span className={`text-[10px] font-mono block truncate ${isError ? 'text-red-400' : iconColor}`}>{isError ? 'Błąd' : 'Media Server'}</span>
          </div>
        </div>

        <div className="z-10 flex items-center shrink-0 gap-3">
          {isError ? (
             <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Offline</span>
          ) : (
             <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                {activeStreams > 0 ? (
                   <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399] animate-pulse"></span>
                ) : (
                   <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                )}
                <span className="text-sm font-black text-white">{activeStreams} <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Streamów</span></span>
             </div>
          )}
          <div className={`text-slate-500 group-hover:${iconColor} transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5`}>
             <ExternalLink size={14}/>
          </div>
        </div>
        <a href={data.clickUrl || data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="absolute inset-0 z-20"></a>
      </div>
    );
  }

  // --- WIDOK NORMALNY (h >= 2) - BOGATY ---
  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-colors duration-300 shadow-2xl rounded-2xl ${bgClass}`}>
      {isOnline && <div className={`absolute -right-4 -top-4 w-32 h-32 blur-3xl rounded-full pointer-events-none bg-${colorBase}-500/10`} />}
      <Icon className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <Icon size={22} />
            </div>
            <div>
               <span className="font-bold text-slate-200 text-sm block leading-tight truncate max-w-[120px]">{data.name}</span>
               <span className={`text-[10px] font-mono ${iconColor}`}>media-server</span>
            </div>
         </div>
         <a href={data.clickUrl || data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className={`text-slate-500 hover:${iconColor} transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5 z-20`}>
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
                   Brak dostępu
                 </div>
                 <div className="text-xs text-slate-400 font-mono mt-1">
                   {stats?.secondaryText || 'Wymagana konfiguracja'}
                 </div>
              </div>
            )}

            {isOnline && (
               <div className="mt-auto flex flex-col gap-2">
                  {/* Górny pasek: Aktywne odtwarzanie */}
                  <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/5 shadow-inner">
                     <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                       <PlayCircle size={12} className={colorBase === 'orange' ? 'text-orange-500' : 'text-purple-500'}/> Odtwarzanie
                     </span>
                     <span className="text-sm font-black text-white font-mono flex items-center gap-2">
                       {activeStreams > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                       {activeStreams}
                     </span>
                  </div>
                  
                  {/* Dolny pasek: Statystyki Biblioteki */}
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1 truncate w-full justify-center"><Film size={10} className="text-blue-400" /> <span className="hidden sm:inline">Filmy</span></span>
                        <span className="text-xs text-white font-mono font-bold">{counts.MovieCount}</span>
                     </div>
                     <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1 truncate w-full justify-center"><Tv size={10} className="text-emerald-400" /> <span className="hidden sm:inline">Seriale</span></span>
                        <span className="text-xs text-white font-mono font-bold">{counts.SeriesCount}</span>
                     </div>
                     <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1 truncate w-full justify-center"><PlayCircle size={10} className="text-purple-400" /> <span className="hidden sm:inline">Odcinki</span></span>
                        <span className="text-xs text-white font-mono font-bold">{counts.EpisodeCount}</span>
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