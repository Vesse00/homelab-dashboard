'use client';

import { useState, useCallback } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2, Globe, CheckCircle2, Ban, GripHorizontal, X, Lock, Unlock } from 'lucide-react';
import { useKioskFetch } from '@/app/hooks/useKioskFetch';
import { useSmartInterval } from '@/app/hooks/useSmartInterval';
import { useTranslations } from 'next-intl';

interface KioskPiholeWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
  w?: number;
  h?: number;
  data: any; // Zawiera data.id usługi z bazy
}

export default function KioskPiholeWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, isLocked, onToggleLock, w = 2, h = 2, data
}: KioskPiholeWidgetProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const kioskFetch = useKioskFetch();
  const t = useTranslations('WidgetTemplates');

  const fetchStats = useCallback(async () => {
    const targetId = data?.serviceId || data?.id;

    if (!targetId) {
      console.error("Kiosk Widget: Brak ID usługi w obiekcie data!", data);
      setError('Brak ID usługi');
      setIsLoading(false); // <--- Wyłączamy kółko ładowania, żeby pokazać błąd!
      return;
    }
    try {
      // ZMIENIONE ZAPYTANIE NA POST
      const res = await kioskFetch(`/api/services/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: data.serviceId }) // Przesyłamy ID usługi!
      });
      
      if (!res.ok) throw new Error('Błąd API');
      const json = await res.json();
      setStats(json);
      setError('');
    } catch (err) {
      setError('Błąd poł.');
    } finally {
      setIsLoading(false);
    }
  }, [kioskFetch, data?.id]);

  // Odświeża co 10 sekund (lub rzadziej, gdy karta jest nieaktywna)
  useSmartInterval(fetchStats, 10000, 60000);

  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error' || error;
  
  let bgClass = 'bg-slate-900/70 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let glowClass = '';
  let Icon = Shield;

  if (isOnline) {
    bgClass = 'bg-gradient-to-br from-emerald-950/80 to-slate-900/60 border-emerald-900/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)]';
    iconColor = 'text-emerald-400';
    glowClass = 'from-emerald-500/20';
    Icon = ShieldCheck;
  } else if (isError) {
    bgClass = 'bg-gradient-to-br from-red-950/80 to-slate-900/60 border-red-900/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)]';
    iconColor = 'text-red-500';
    glowClass = 'from-red-500/20';
    Icon = ShieldAlert;
  }

  const blockedCount = stats?.primaryText ? parseInt(stats.primaryText.replace(/\D/g, '')) || 0 : 0;
  const totalQueries = stats?.queries || 1;
  const allowedCount = Math.max(0, totalQueries - blockedCount);
  const blockedPercent = totalQueries > 0 ? Math.round((blockedCount / totalQueries) * 100) : 0;
  const chartGradient = `conic-gradient(#ef4444 ${blockedPercent}%, #10b981 0)`;
  
  const isTinyHeight = h <= 1;
  const isCompactHeight = h <= 2;       
  const isVertical = w <= 2 && h >= 3;
  const isLarge = w >= 3 && h >= 3;

  const showHeader = h >= 2;

  return (
    <div 
      style={{ ...style, containerType: 'size' }} 
      className={`absolute inset-0 backdrop-blur-2xl border rounded-3xl flex flex-col overflow-hidden transition-all duration-300 group ${bgClass} ${className || ''}`}
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      {isOnline && <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />}
      <Icon className={`absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} />

      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-emerald-500/50 rounded-3xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}><X size={16} /></div>
           <div className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 ${isLocked ? 'text-amber-400 bg-slate-800/90' : 'text-slate-400 bg-slate-800/80'}`} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}>
             {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
           </div>
           <GripHorizontal className="text-emerald-400 mb-1" size={24} />
           <span className="text-white font-bold tracking-wide text-xs uppercase">{data.type} KIOSK</span>
        </div>
      )}

      {/* NAGŁÓWEK */}
      {showHeader && (
        <div className={`flex justify-between items-start z-10 shrink-0 ${isCompactHeight ? 'p-2 px-3' : 'p-4'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
                 <Icon size={isCompactHeight ? 16 : 20} />
              </div>
              <div className="truncate">
                <span style={{ fontSize: 'min(6cqw, 14cqh)' }} className="font-bold text-white block leading-tight truncate">{data.name}</span>
                <span style={{ fontSize: 'min(4cqw, 10cqh)' }} className="text-slate-400 font-mono tracking-widest uppercase">DNS Filter</span>
              </div>
           </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col z-10 min-h-0 justify-center ${showHeader ? (isCompactHeight ? 'px-3 pb-2' : 'px-4 pb-4') : 'p-[2cqmin]'}`}>
         {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-emerald-500/50" /></div>
         ) : isError ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <span style={{ fontSize: 'min(12cqw, 20cqh)' }} className="font-black text-red-400 drop-shadow-md leading-none">{error || t('noData')}</span>
            </div>
         ) : (
            <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-center gap-[2cqmin] min-h-0 w-full h-full`}>
               
               <div className={`flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/5 shadow-inner min-h-0 transition-colors group-hover:border-white/10 relative overflow-hidden ${isCompactHeight ? 'flex-1 w-full p-[2cqmin]' : 'w-1/2 h-full p-[2cqmin]'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-b ${glowClass} to-transparent opacity-20`} />
                  <span style={{ fontSize: isTinyHeight ? 'min(25cqw, 60cqh)' : isCompactHeight ? 'min(20cqw, 35cqh)' : 'min(14cqw, 20cqh)' }} className="font-black text-red-400 tracking-tighter leading-none relative z-10 drop-shadow-md">
                    {blockedPercent}<span style={{ fontSize: 'min(8cqw, 12cqh)' }} className="opacity-70">%</span>
                  </span>
                  {!isTinyHeight && <span style={{ fontSize: isCompactHeight ? 'min(5cqw, 10cqh)' : 'min(3.5cqw, 7cqh)' }} className="text-slate-400 font-bold tracking-widest mt-1 uppercase relative z-10 shrink-0">{t('Pihole.blocked')}</span>}
               </div>

               <div className={`flex flex-col justify-center gap-2 bg-black/40 rounded-2xl border border-white/5 shadow-inner min-h-0 p-[2cqmin] ${isCompactHeight || isTinyHeight ? 'flex-1 w-full h-full' : 'w-1/2 h-full'}`}>
                 {isLarge ? (
                   <div className="flex flex-col items-center w-full h-full justify-center">
                      <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] mb-3" style={{ background: chartGradient }}>
                         <div className="w-14 h-14 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                            <Globe size={16} className="text-emerald-400 opacity-50" />
                         </div>
                      </div>
                      <div className="w-full bg-slate-800/50 rounded-lg p-2 flex justify-between items-center">
                         <span className="text-[10px] text-slate-400 font-bold uppercase">{t('Pihole.queries')}</span>
                         <span className="text-sm text-white font-black">{totalQueries.toLocaleString()}</span>
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col h-full justify-center gap-2">
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                         <CheckCircle2 size={14} className="text-emerald-400" />
                         <span style={{ fontSize: 'min(8cqw, 14cqh)' }} className="text-emerald-100 font-black truncate ml-2">{allowedCount}</span>
                      </div>
                      <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                         <Globe size={14} className="text-blue-400" />
                         <span style={{ fontSize: 'min(8cqw, 14cqh)' }} className="text-blue-100 font-black truncate ml-2">{totalQueries}</span>
                      </div>
                   </div>
                 )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}