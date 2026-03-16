'use client';

import { useState, useCallback } from 'react';
import { Cpu, Activity, ServerCrash, GripHorizontal, X, Lock, Unlock } from 'lucide-react';
import { useKioskFetch } from '@/app/hooks/useKioskFetch';
import { useSmartInterval } from '@/app/hooks/useSmartInterval';

interface KioskSystemWidgetProps {
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
}

export default function KioskSystemWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, isLocked, onToggleLock, w = 12, h = 4
}: KioskSystemWidgetProps) {
  const [stats, setStats] = useState<{ cpu: number; mem: number } | null>(null);
  const [error, setError] = useState('');
  const kioskFetch = useKioskFetch();

  const fetchStats = useCallback(async () => {
    try {
      const res = await kioskFetch('/api/system/stats');
      if (!res.ok) throw new Error('Brak autoryzacji');
      const data = await res.json();
      setStats({
        cpu: isNaN(data.cpu) ? 0 : data.cpu,
        mem: isNaN(data.ram) ? 0 : data.ram
      });
      setError('');
    } catch (err) {
      setError('Brak połącz.');
    }
  }, [kioskFetch]);

  useSmartInterval(fetchStats, 3000, 60000);

  const getCpuColor = (val: number) => val > 80 ? 'text-red-400' : val > 50 ? 'text-amber-400' : 'text-emerald-400';
  const getMemColor = (val: number) => val > 85 ? 'text-red-400' : val > 65 ? 'text-amber-400' : 'text-purple-400';
  
  const getCpuBg = (val: number) => val > 80 ? 'bg-red-500/10 border-red-500/20' : val > 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/80 border-slate-700/50';
  const getMemBg = (val: number) => val > 85 ? 'bg-red-500/10 border-red-500/20' : val > 65 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/80 border-slate-700/50';

  const fallbackHeight = `${Math.max(80, h * 40)}px`;

  // --- DETEKCJA MIKRO I COMPACT ROZMIARÓW ---
  const isMicro = w <= 2 && h <= 2;     
  const isCompactHeight = h <= 2;       // Ukryjemy nagłówek dla płaskich widgetów (np. 3x2)
  const isCompactWidth = w <= 3;
  const isVertical = w <= 2 && h >= 3;  

  return (
    <div 
      style={{ 
        ...style, 
        containerType: 'size',
        minHeight: (!style?.height || style.height === 'auto') ? fallbackHeight : undefined
      }} 
      className={`bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 h-full w-full group ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-emerald-500/50 rounded-3xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={16} />
           </div>
           <div 
             className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 ${isLocked ? 'text-amber-400 bg-slate-800/90' : 'text-slate-400 bg-slate-800/80'}`} 
             onMouseDown={(e) => e.stopPropagation()} 
             onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
           >
             {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
           </div>
           <GripHorizontal className="text-emerald-400 mb-1" size={24} />
           {!isCompactWidth && <span className="text-white font-bold tracking-wide text-xs">SYSTEM</span>}
        </div>
      )}

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 z-10 p-2 text-center min-h-0">
          <ServerCrash size={24} className="mb-1 opacity-50 drop-shadow-md" />
          <span className="font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">{error}</span>
        </div>
      ) : !stats ? (
        <div className="flex-1 flex items-center justify-center z-10">
          <Activity className="text-emerald-500/30 animate-pulse" size={isMicro ? 24 : 48} />
        </div>
      ) : (
        <div className={`flex flex-col h-full z-10 min-h-0 ${isCompactHeight ? 'p-2' : 'p-3 sm:p-4'}`}>
          
          {/* UKRYWAMY NAGŁÓWEK "Serwer" w trybie h=2 lub w=2, by zrobić miejsce na same procenty! */}
          {!isCompactHeight && (
            <div className="flex justify-between items-center mb-2 px-1 shrink-0">
              <h3 style={{ fontSize: 'min(5cqw, 10cqh)' }} className="font-bold text-slate-300 uppercase tracking-widest truncate flex items-center gap-2">
                <ServerCrash size={14} className="text-slate-500 hidden sm:block" /> Serwer
              </h3>
              <div className="bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
                <Activity className="text-emerald-400 animate-pulse" style={{ width: 'min(4cqw, 8cqh)', height: 'min(4cqw, 8cqh)' }} />
              </div>
            </div>
          )}

          <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-center min-h-0 ${isCompactHeight ? 'gap-2' : 'gap-3 sm:gap-4'}`}>
            
            {/* CPU */}
            <div className={`flex-1 w-full flex flex-col items-center justify-center rounded-2xl h-full border shadow-inner min-h-0 transition-colors ${getCpuBg(stats.cpu)} ${isCompactHeight ? 'p-1' : 'p-2'}`}>
              {(!isMicro && !isCompactHeight) && <Cpu className={`mb-1 shrink-0 ${getCpuColor(stats.cpu)}`} style={{ width: 'min(12cqw, 18cqh)', height: 'min(12cqw, 18cqh)' }} />}
              
              <span 
                style={{ fontSize: isMicro ? 'min(35cqw, 45cqh)' : isCompactHeight ? 'min(20cqw, 35cqh)' : 'min(16cqw, 24cqh)' }} 
                className={`font-black ${getCpuColor(stats.cpu)} tracking-tighter leading-none`}
              >
                {Math.round(stats.cpu)}<span style={{ fontSize: isMicro ? 'min(15cqw, 20cqh)' : 'min(8cqw, 12cqh)' }} className="opacity-70">%</span>
              </span>
              
              {!isMicro && <span style={{ fontSize: isCompactHeight ? 'min(5cqw, 10cqh)' : 'min(3.5cqw, 7cqh)' }} className="text-slate-400 font-bold tracking-widest mt-1 uppercase shrink-0">CPU</span>}
            </div>

            {/* RAM */}
            <div className={`flex-1 w-full flex flex-col items-center justify-center rounded-2xl h-full border shadow-inner min-h-0 transition-colors ${getMemBg(stats.mem)} ${isCompactHeight ? 'p-1' : 'p-2'}`}>
              {(!isMicro && !isCompactHeight) && (
                <div className={`rounded-full border-[2px] mb-1 flex items-center justify-center shrink-0 shadow-sm ${getMemColor(stats.mem).replace('text-', 'border-')} ${getMemColor(stats.mem).replace('text-', 'bg-').replace('400', '900/30')}`} style={{ width: 'min(12cqw, 18cqh)', height: 'min(12cqw, 18cqh)' }}>
                  <span className={`font-black ${getMemColor(stats.mem)} block text-center leading-none`} style={{ fontSize: 'min(6cqw, 10cqh)' }}>R</span>
                </div>
              )}
              
              <span 
                style={{ fontSize: isMicro ? 'min(35cqw, 45cqh)' : isCompactHeight ? 'min(20cqw, 35cqh)' : 'min(16cqw, 24cqh)' }} 
                className={`font-black ${getMemColor(stats.mem)} tracking-tighter leading-none`}
              >
                {Math.round(stats.mem)}<span style={{ fontSize: isMicro ? 'min(15cqw, 20cqh)' : 'min(8cqw, 12cqh)' }} className="opacity-70">%</span>
              </span>
              
              {!isMicro && <span style={{ fontSize: isCompactHeight ? 'min(5cqw, 10cqh)' : 'min(3.5cqw, 7cqh)' }} className="text-slate-400 font-bold tracking-widest mt-1 uppercase shrink-0">RAM</span>}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}