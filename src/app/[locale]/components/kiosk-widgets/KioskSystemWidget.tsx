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

  const fallbackHeight = `${Math.max(120, h * 40)}px`;

  // --- DETEKCJA MIKRO I COMPACT ROZMIARÓW ---
  const isMicro = w <= 2 && h <= 2;
  const isTinyWidth = w <= 2;
  const isCompactWidth = w <= 3;
  const isTinyHeight = h <= 1;
  const isCompactHeight = h <= 2;
  const isVertical = w <= 2 && h >= 3;  
  
  const showHeader = h >= 2;

  return (
    <div 
      style={{ 
        ...style, 
        containerType: 'size',
        // usunięto fallbackHeight, polegamy na stylach nadrzędnego kontenera grida
      }} 
      className={`absolute inset-0 backdrop-blur-2xl border rounded-3xl flex flex-col overflow-hidden transition-all duration-300 group bg-slate-900/70 border-slate-700/50 shadow-[0_8px_32px_rgba(2,6,23,0.6)] ${className || ''}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      <ServerCrash className={`absolute -right-6 -bottom-6 ${isCompactHeight ? 'w-32 h-32' : 'w-48 h-48'} text-slate-500 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500`} />

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
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 z-10 p-[2cqmin] text-center min-h-0">
          <ServerCrash size={24} className="mb-1 opacity-50 drop-shadow-md" />
          <span style={{ fontSize: 'min(10cqw, 20cqh)' }} className="font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">{error}</span>
        </div>
      ) : !stats ? (
        <div className="flex-1 flex items-center justify-center z-10">
          <Activity className="text-emerald-500/30 animate-pulse" size={isTinyHeight ? 24 : 48} />
        </div>
      ) : (
        <div className={`flex flex-col h-full w-full z-10 min-h-0 ${showHeader ? (isCompactHeight ? 'p-2' : 'p-3 sm:p-4') : 'p-[2cqmin]'}`}>
          
          {/* UKRYWAMY NAGŁÓWEK w trybie mocno kompaktowym, by zrobić miejsce na same procenty! */}
          {showHeader && (
            <div className="flex justify-between items-center mb-2 px-1 shrink-0">
              <h3 style={{ fontSize: 'min(5cqw, 10cqh)' }} className="font-bold text-slate-300 uppercase tracking-widest truncate flex items-center gap-2">
                <ServerCrash size={14} className="text-slate-500 hidden sm:block" /> Serwer
              </h3>
              <div className="bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
                <Activity className="text-emerald-400 animate-pulse" style={{ width: 'min(4cqw, 8cqh)', height: 'min(4cqw, 8cqh)' }} />
              </div>
            </div>
          )}

          <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-center min-h-0 w-full h-full gap-[2cqmin]`}>
            
            {/* CPU */}
            <div className={`flex flex-col rounded-2xl h-full w-full border shadow-inner min-h-0 transition-colors relative overflow-hidden ${getCpuBg(stats.cpu)} p-[3cqmin]`}>
              <div className="w-full flex justify-start items-center gap-1 opacity-70 shrink-0">
                <Cpu style={{ width: 'max(12px, min(5cqw, 10cqh))', height: 'max(12px, min(5cqw, 10cqh))' }} className={getCpuColor(stats.cpu)} />
                <span style={{ fontSize: 'max(8px, min(4cqw, 8cqh))' }} className="font-bold tracking-widest uppercase text-slate-300 leading-none">CPU</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center w-full z-10 min-h-0">
                <div className="flex items-baseline justify-center">
                  <span 
                    style={{ fontSize: isTinyHeight ? 'min(24cqw, 45cqh)' : (isVertical ? 'min(24cqw, 30cqh)' : 'min(18cqw, 26cqh)') }} 
                    className={`font-black tracking-tighter leading-none drop-shadow-md ${getCpuColor(stats.cpu)}`}
                  >
                    {Math.round(stats.cpu)}
                  </span>
                  <span style={{ fontSize: isTinyHeight ? 'min(10cqw, 18cqh)' : 'min(8cqw, 14cqh)' }} className={`font-bold ml-[2px] opacity-80 ${getCpuColor(stats.cpu)}`}>%</span>
                </div>
              </div>
            </div>

            {/* RAM */}
            <div className={`flex flex-col rounded-2xl h-full w-full border shadow-inner min-h-0 transition-colors relative overflow-hidden ${getMemBg(stats.mem)} p-[3cqmin]`}>
              <div className="w-full flex justify-start items-center gap-1 opacity-70 shrink-0">
                <div className={`rounded-sm border-[1px] flex items-center justify-center shrink-0 shadow-sm ${getMemColor(stats.mem).replace('text-', 'border-')} ${getMemColor(stats.mem).replace('text-', 'bg-').replace('400', '900/30')}`} style={{ width: 'max(12px, min(5cqw, 10cqh))', height: 'max(12px, min(5cqw, 10cqh))' }}>
                  <span className={`font-black ${getMemColor(stats.mem)} block text-center leading-none`} style={{ fontSize: 'max(7px, min(3cqw, 6cqh))' }}>R</span>
                </div>
                <span style={{ fontSize: 'max(8px, min(4cqw, 8cqh))' }} className="font-bold tracking-widest uppercase text-slate-300 leading-none">RAM</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center w-full z-10 min-h-0">
                <div className="flex items-baseline justify-center">
                  <span 
                    style={{ fontSize: isTinyHeight ? 'min(24cqw, 45cqh)' : (isVertical ? 'min(24cqw, 30cqh)' : 'min(18cqw, 26cqh)') }} 
                    className={`font-black tracking-tighter leading-none drop-shadow-md ${getMemColor(stats.mem)}`}
                  >
                    {Math.round(stats.mem)}
                  </span>
                  <span style={{ fontSize: isTinyHeight ? 'min(10cqw, 18cqh)' : 'min(8cqw, 14cqh)' }} className={`font-bold ml-[2px] opacity-80 ${getMemColor(stats.mem)}`}>%</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}