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
  const isExpanded = w >= 3 && h >= 3;

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
              <span className="font-bold text-slate-200 text-sm block leading-tight">{data.name || 'Vaultwarden'}</span>
              <span className={`text-[10px] font-mono ${iconColor}`}>password-manager</span>
            </div>
         </div>
         <a href={data.url} target="_blank" rel="noopener noreferrer" onMouseDown={e => e.stopPropagation()} className="text-slate-500 hover:text-sky-400 transition-colors p-1.5 bg-black/30 rounded-lg border border-white/5">
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
            
            {/* WIDOK BŁĘDU (Zgodny z AdGuardem) */}
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

            {/* WIDOK NORMALNY (Kompaktowy 2x2) */}
            {isOnline && !isExpanded && (
              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 mt-auto shadow-inner">
                 <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                   <ShieldCheck size={12} className="text-sky-500"/> Szyfrowanie
                 </span>
                 <span className="text-xs font-black text-white font-mono tracking-wider">
                   {stats?.primaryText || 'AKTYWNE'}
                 </span>
              </div>
            )}

            {/* WIDOK NORMALNY (Rozszerzony 3x3) */}
            {isOnline && isExpanded && (
              <div className="mt-4 flex-1 flex flex-col justify-end gap-3">
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Lock size={12} className="text-sky-400" /> Baza Haseł</span>
                       <span className="text-sm text-white font-mono font-bold">Zaszyfrowana</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center">
                       <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><ShieldCheck size={12} className="text-emerald-400" /> Web Vault</span>
                       <span className="text-sm text-white font-mono font-bold">Online</span>
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