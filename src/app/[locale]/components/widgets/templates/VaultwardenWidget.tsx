'use client';

import { Key, ShieldCheck, Loader2, ExternalLink, AlertTriangle, Lock } from 'lucide-react';

interface VaultwardenWidgetProps {
  data: any;
  stats?: any;
  isLoading?: boolean;
  w?: number;
  h?: number;
}

export default function VaultwardenWidget({ data, stats, isLoading, w = 2, h = 2 }: VaultwardenWidgetProps) {
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';

  // Domyślne kolory (oczekiwanie)
  let bgClass = 'bg-slate-900/60 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';
  let TopIcon = Key;

  if (isOnline) {
    // Szafirowo-niebieski motyw dla bezpiecznego sejfu
    bgClass = 'bg-sky-950/40 backdrop-blur-md border-sky-900/50';
    iconColor = 'text-sky-500';
    glowClass = 'bg-sky-500/10';
    TopIcon = Lock;
  } else if (isError) {
    // Standardowy krwisty błąd
    bgClass = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
    iconColor = 'text-red-500';
    TopIcon = AlertTriangle;
  }

  // --- WIDOK KOMPAKTOWY (h = 1) ---
  if (h === 1) {
    return (
      <div className={`h-full w-full border flex items-center justify-between px-4 relative overflow-hidden transition-all duration-300 shadow-xl ${bgClass} rounded-2xl group`}>
        {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-24 h-24 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}
        
        {/* Lewa strona (Ikona + Tekst) z zabezpieczeniem przed wypychaniem */}
        <div className="flex items-center gap-3 z-10 flex-1 min-w-0 mr-3">
          <div className={`shrink-0 p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
             <TopIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-200 text-sm block leading-tight truncate">{data.name || 'Vaultwarden'}</span>
            <span className={`text-[10px] font-mono block truncate ${isError ? 'text-red-400' : 'text-sky-500'}`}>{isError ? 'Błąd' : 'Zaszyfrowany'}</span>
          </div>
        </div>

        {/* Prawa strona (Status) - zablokowana przed ściskaniem */}
        <div className="z-10 flex items-center shrink-0">
          {isError ? (
             <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">{stats?.primaryText || 'Offline'}</span>
          ) : (
             <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20 flex items-center gap-1 mr-2">
              <Lock size={12}/> <br/>
              <span className="hidden sm:inline">Safe</span>
              </span>
          )}
          <div className="text-slate-500 group-hover:text-sky-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5">
             <ExternalLink size={14}/>
          </div>
        </div>
        
        {/* Ukryty klikalny obszar na cały kafelek dla wygody */}
        <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="absolute inset-0 z-20"></a>
      </div>
    );
  }

  // --- WIDOK NORMALNY (h >= 2) ---
  return (
    <div className={`h-full w-full border flex flex-col p-5 relative overflow-hidden transition-all duration-300 shadow-2xl ${bgClass} rounded-2xl`}>
      <Key className={`absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${iconColor}`} />
      {isOnline && glowClass && <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${glowClass}`} />}

      <div className="flex justify-between items-start z-10 mb-2">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <TopIcon size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block leading-tight truncate max-w-[120px]">{data.name || 'Vaultwarden'}</span>
              <span className={`text-[10px] font-mono ${iconColor}`}>password-manager</span>
            </div>
         </div>
         <a href={data.clickUrl} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-sky-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5 z-20">
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
            
            {/* WIDOK BŁĘDU */}
            {isError && (
              <div className="mt-auto mb-2">
                 <div className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md">
                   {stats?.primaryText || 'Brak dostępu'}
                 </div>
                 <div className="text-xs text-slate-400 font-mono mt-1">
                   {stats?.secondaryText || 'Sejf niedostępny'}
                 </div>
              </div>
            )}

            {/* WIDOK NORMALNY Z SZCZEGÓŁAMI - Teraz domyślnie od h=2 */}
            {isOnline && (
              <div className="mt-4 flex-1 flex flex-col justify-end gap-3">
                 <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                       <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1 truncate w-full justify-center"><Lock size={10} className="text-sky-400" /> Baza</span>
                       <span className="text-[11px] sm:text-xs text-white font-mono font-bold truncate w-full">Zaszyfrowana</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                       <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1 truncate w-full justify-center"><ShieldCheck size={10} className="text-emerald-400" /> API</span>
                       <span className="text-[11px] sm:text-xs text-white font-mono font-bold truncate w-full">Online</span>
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