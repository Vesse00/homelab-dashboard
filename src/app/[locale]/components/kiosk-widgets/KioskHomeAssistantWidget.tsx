'use client';

import { useState, useCallback } from 'react';
import { Home, AlertTriangle, Loader2, Lightbulb, GripHorizontal, X, Lock, Unlock } from 'lucide-react';
import { useKioskFetch } from '@/app/hooks/useKioskFetch';
import { useSmartInterval } from '@/app/hooks/useSmartInterval';
import { useTranslations } from 'next-intl';

interface KioskHomeAssistantWidgetProps {
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
  data: any;
}

export default function KioskHomeAssistantWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, isLocked, onToggleLock, w = 2, h = 2, data
}: KioskHomeAssistantWidgetProps) {
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

  useSmartInterval(fetchStats, 5000, 30000); // Częstsze odświeżanie dla HA (5 sek)

  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error' || error;
  
  const entities = stats?.entities || { total: 0, on: 0, off: 0, unavailable: 0 };
  const onPercent = entities.total > 0 ? (entities.on / entities.total) * 100 : 0;
  const offPercent = entities.total > 0 ? (entities.off / entities.total) * 100 : 0;

  const isCompactHeight = h <= 2;       
  const isVertical = w <= 2 && h >= 3;
  const isLarge = w >= 3 && h >= 3;

  let bgClass = 'bg-slate-900/70 border-slate-700/50';
  let iconColor = 'text-slate-500';
  let TopIcon = Home;

  if (isOnline) {
    bgClass = 'bg-gradient-to-br from-blue-950/80 to-slate-900/60 border-blue-900/30 shadow-[0_8px_32px_rgba(59,130,246,0.15)]';
    iconColor = 'text-blue-400';
    TopIcon = Home;
  } else if (isError) {
    bgClass = 'bg-gradient-to-br from-red-950/80 to-slate-900/60 border-red-900/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)]';
    iconColor = 'text-red-500';
    TopIcon = AlertTriangle;
  }

  return (
    <div 
      style={{ ...style, containerType: 'size', minHeight: `${Math.max(120, h * 40)}px` }} 
      className={`h-full w-full backdrop-blur-2xl border rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300 group ${bgClass} ${className}`}
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      {isOnline && <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />}
      <TopIcon className={`absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.04] pointer-events-none transform -rotate-12 transition-all duration-500 ${isOnline ? 'text-amber-400' : 'text-slate-400'}`} />

      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-3xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}><X size={16} /></div>
           <div className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 ${isLocked ? 'text-amber-400 bg-slate-800/90' : 'text-slate-400 bg-slate-800/80'}`} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}>
             {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
           </div>
           <GripHorizontal className="text-blue-400 mb-1" size={24} />
           <span className="text-white font-bold tracking-wide text-xs uppercase">HOME ASST KIOSK</span>
        </div>
      )}

      {/* NAGŁÓWEK */}
      <div className={`flex justify-between items-start z-10 shrink-0 ${isCompactHeight ? 'p-3' : 'p-4'}`}>
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-black/40 border border-white/5 shadow-inner ${iconColor}`}>
               <TopIcon size={isCompactHeight ? 16 : 20} />
            </div>
            <div className="truncate">
              <span style={{ fontSize: 'min(6cqw, 14cqh)' }} className="font-bold text-white block leading-tight truncate">{data.name || 'Home Assistant'}</span>
              <span style={{ fontSize: 'min(4cqw, 10cqh)' }} className="text-slate-400 font-mono tracking-widest uppercase">Smart Home</span>
            </div>
         </div>
      </div>

      <div className={`flex-1 flex flex-col z-10 min-h-0 justify-center ${isCompactHeight ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
         {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500/50" /></div>
         ) : isError ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <span style={{ fontSize: 'min(12cqw, 20cqh)' }} className="font-black text-red-400 drop-shadow-md leading-none">{error || t('error')}</span>
            </div>
         ) : (
            <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-center gap-2 sm:gap-4 min-h-0`}>
               
               <div className={`flex flex-col items-center justify-center bg-black/40 rounded-2xl border border-white/5 shadow-inner min-h-0 transition-colors relative overflow-hidden ${isCompactHeight ? 'flex-1 w-full p-2' : 'w-1/2 h-full p-3'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-b ${entities.on > 0 ? 'from-amber-500/20' : 'from-slate-500/10'} to-transparent opacity-30`} />
                  <Lightbulb size={18} className={`${entities.on > 0 ? 'text-amber-400 shadow-[0_0_10px_#fbbf24] bg-amber-400/10 rounded-full' : 'text-slate-600'} mb-1 relative z-10`} />
                  <span style={{ fontSize: isCompactHeight ? 'min(25cqw, 40cqh)' : 'min(18cqw, 26cqh)' }} className={`font-black tracking-tighter leading-none relative z-10 drop-shadow-md ${entities.on > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {entities.on > 0 ? entities.on : '0'}
                  </span>
                  <span style={{ fontSize: isCompactHeight ? 'min(5cqw, 10cqh)' : 'min(3.5cqw, 7cqh)' }} className="text-slate-400 font-bold tracking-widest mt-1 uppercase relative z-10 shrink-0">{t('HomeAssistant.turnedOn')}</span>
               </div>

               <div className={`flex flex-col justify-center gap-2 min-h-0 ${isCompactHeight ? 'flex-1 w-full' : 'w-1/2 h-full'}`}>
                 {isLarge ? (
                   <div className="w-full flex flex-col justify-center flex-1 bg-black/40 rounded-2xl border border-white/5 p-4">
                      <span className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center justify-between">
                        Wszystkie: <span className="text-white font-black text-lg">{entities.total}</span>
                      </span>
                      <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-white/5">
                         <div className="h-full bg-amber-400 shadow-[0_0_10px_#fbbf24] transition-all duration-1000" style={{ width: `${onPercent}%` }}></div>
                         <div className="h-full bg-slate-600 transition-all duration-1000" style={{ width: `${offPercent}%` }}></div>
                      </div>
                      {/* MIEJSCE NA PRZYCISKI AKCYJNE W PRZYSZŁOŚCI */}
                      {/* <div className="mt-4 flex gap-2"><button className="...">Scena: Noc</button></div> */}
                   </div>
                 ) : (
                   <div className="flex gap-2 h-full">
                      <div className="flex-1 flex flex-col items-center justify-center bg-black/30 rounded-xl border border-white/5 p-2">
                         <span style={{ fontSize: 'min(12cqw, 20cqh)' }} className="font-black text-slate-300">{entities.off}</span>
                         <span style={{ fontSize: 'min(4.5cqw, 8cqh)' }} className="text-slate-500 font-bold uppercase tracking-widest mt-1">OFF</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center bg-black/30 rounded-xl border border-white/5 p-2">
                         <span style={{ fontSize: 'min(12cqw, 20cqh)' }} className="font-black text-slate-300">{entities.total}</span>
                         <span style={{ fontSize: 'min(4.5cqw, 8cqh)' }} className="text-slate-500 font-bold uppercase tracking-widest mt-1">SUMA</span>
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