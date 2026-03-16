'use client';

import { useState, useCallback } from 'react';
import { Cpu, Activity, ServerCrash, GripHorizontal, X, Lock, Unlock, ArrowDownRight } from 'lucide-react';
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

  // --- DYNAMICZNE SKALOWANIE ---
  const getValueSize = (width: number) => {
    if (width <= 4) return 'text-4xl';
    if (width <= 6) return 'text-5xl';
    if (width <= 8) return 'text-6xl';
    return 'text-7xl';
  };

  const getPercentSize = (width: number) => {
    if (width <= 4) return 'text-lg';
    if (width <= 6) return 'text-xl';
    return 'text-2xl';
  };

  const getLabelSize = (width: number) => {
    if (width <= 4) return 'text-[10px]';
    return 'text-xs';
  };

  const getIconSize = (width: number) => {
    if (width <= 4) return 20;
    if (width <= 6) return 24;
    return 32;
  };

  return (
    <div 
      style={style} 
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 h-full w-full ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-emerald-500 opacity-5 pointer-events-none transform -rotate-12" />

      {/* Tryb Edycji */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-emerald-500/50 rounded-xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg transition-colors" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={18} />
           </div>
           <div 
             className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 transition-colors ${isLocked ? 'text-amber-400 bg-slate-800/90 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700'}`} 
             onMouseDown={(e) => e.stopPropagation()} 
             onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
           >
             {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
           </div>
           <GripHorizontal className="text-emerald-400 mb-2" size={28} />
           <span className="text-white font-bold tracking-wide">SYSTEM KIOSK</span>
           <div className="absolute bottom-2 right-2 text-emerald-400/80 pointer-events-none flex items-center justify-center p-1 bg-emerald-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 z-10 p-4 text-center min-h-0">
          <ServerCrash size={32} className="mb-2 opacity-50" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      ) : !stats ? (
        <div className="flex-1 bg-slate-800/50 animate-pulse m-4 rounded-xl z-10"></div>
      ) : (
        <div className="flex flex-col h-full z-10 p-4 min-h-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-bold text-slate-300 uppercase tracking-widest truncate ${w <= 4 ? 'text-xs' : 'text-sm'}`}>Serwer</h3>
            <Activity className="text-emerald-500 animate-pulse shrink-0" size={16} />
          </div>

          <div className={`flex-1 flex items-center justify-center min-h-0 ${w <= 4 ? 'gap-2' : 'gap-4'}`}>
            {/* CPU */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/40 rounded-xl h-full border border-slate-700/50 min-h-0">
              <Cpu size={getIconSize(w)} className={`mb-1 ${getCpuColor(stats.cpu)}`} />
              <span className={`${getValueSize(w)} font-black ${getCpuColor(stats.cpu)} tracking-tighter transition-all duration-300`}>
                {Math.round(stats.cpu)}<span className={getPercentSize(w)}>%</span>
              </span>
              <span className={`text-slate-500 font-bold tracking-widest mt-1 uppercase ${getLabelSize(w)}`}>CPU</span>
            </div>

            {/* RAM */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/40 rounded-xl h-full border border-slate-700/50 min-h-0">
              <div className={`p-1 rounded-full border-2 mb-1 ${getMemColor(stats.mem).replace('text-', 'border-')}`}>
                <span className={`font-black ${getMemColor(stats.mem)} block text-center leading-none ${w <= 4 ? 'text-xs w-3 h-3' : 'text-sm w-4 h-4'}`}>R</span>
              </div>
              <span className={`${getValueSize(w)} font-black ${getMemColor(stats.mem)} tracking-tighter transition-all duration-300`}>
                {Math.round(stats.mem)}<span className={getPercentSize(w)}>%</span>
              </span>
              <span className={`text-slate-500 font-bold tracking-widest mt-1 uppercase ${getLabelSize(w)}`}>RAM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}