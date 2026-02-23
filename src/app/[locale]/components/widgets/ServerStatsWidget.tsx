'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, ArrowDownRight, Cpu, MemoryStick, ThermometerSun, Activity, Lock, Unlock } from 'lucide-react';

interface ServerStatsWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  w?: number;
  h?: number;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
}

export default function ServerStatsWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, w = 2, h = 2, isLocked, onToggleLock
}: ServerStatsWidgetProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/system/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000); // Odświeża co 3 sekundy
    return () => clearInterval(interval);
  }, []);

  const isExpanded = w >= 3 && h >= 3;

  // Obliczenia kolorów
  const getCpuColor = (val: number) => val > 80 ? 'text-red-500' : val > 50 ? 'text-amber-500' : 'text-blue-400';
  const getCpuBg = (val: number) => val > 80 ? 'bg-red-500' : val > 50 ? 'bg-amber-500' : 'bg-blue-500';
  
  const getRamColor = (val: number) => val > 80 ? 'text-red-500' : val > 60 ? 'text-amber-500' : 'text-purple-400';
  const getRamBg = (val: number) => val > 80 ? 'bg-red-500' : val > 60 ? 'bg-amber-500' : 'bg-purple-500';

  return (
    <div 
      style={style} 
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-500 opacity-[0.03] pointer-events-none transform -rotate-12" />
      
      {/* --- TRYB EDYCJI --- */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={18} />
           </div>
           <div 
             className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 transition-colors ${isLocked ? 'text-amber-400 bg-slate-800/90 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800'}`} 
             onMouseDown={(e) => e.stopPropagation()} 
             onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
           >
             {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
           </div>
           <GripHorizontal className="text-blue-400 mb-2" size={28} />
           <span className="text-white font-bold tracking-wide">Zasoby Serwera</span>
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 z-10 bg-slate-950/20">
        <div className="flex items-center gap-3 w-full pointer-events-none">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 text-slate-300 shadow-inner">
             <Cpu size={18} />
          </div>
          <div>
             <span className="text-sm font-bold text-slate-200 block leading-tight">Zasoby Serwera</span>
             <span className="text-[10px] text-slate-500 font-mono">host-metrics</span>
          </div>
        </div>
      </div>

      {/* TREŚĆ */}
      <div className="flex-1 p-4 flex flex-col justify-center relative z-10">
        {loading || !stats ? (
           <div className="animate-pulse flex gap-4 justify-center">
             <div className="w-16 h-16 rounded-full border-4 border-slate-700"></div>
             <div className="w-16 h-16 rounded-full border-4 border-slate-700"></div>
           </div>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
            
            <div className="flex justify-around items-center flex-1">
              {/* CPU Ring */}
              <div className="flex flex-col items-center gap-2">
                 <div className="relative w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ background: `conic-gradient(currentColor ${stats.cpu}%, #1e293b 0)` }} className={`relative w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] ${getCpuColor(stats.cpu)}`}>
                    <div className="w-[58px] h-[58px] bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/5 shadow-inner">
                       <span className="text-lg font-black text-white">{stats.cpu}%</span>
                    </div>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CPU</span>
              </div>

              {/* RAM Ring */}
              <div className="flex flex-col items-center gap-2">
                 <div className="relative w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ background: `conic-gradient(currentColor ${stats.ram}%, #1e293b 0)` }} className={`relative w-[70px] h-[70px] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] ${getRamColor(stats.ram)}`}>
                    <div className="w-[58px] h-[58px] bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/5 shadow-inner">
                       <span className="text-lg font-black text-white">{stats.ram}%</span>
                    </div>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RAM</span>
              </div>
            </div>

            {/* Dolny pasek (Temp + Ram text) */}
            <div className="mt-auto flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                <MemoryStick size={12} className="text-slate-500"/>
                {stats.ramUsed} / {stats.ramTotal} GB
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                <ThermometerSun size={12} className={stats.temp > 70 ? 'text-red-500' : 'text-orange-400'}/>
                {stats.temp ? `${stats.temp}°C` : 'N/A'}
              </div>
            </div>

            {/* WERSJA ROZSZERZONA */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-white/10 flex-1 flex flex-col justify-end animate-in fade-in duration-500 gap-4">
                 
                 <div>
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                     <span className="flex items-center gap-1"><Cpu size={12} className={getCpuColor(stats.cpu)} /> Obciążenie CPU</span>
                     <span className="text-white">{stats.cpu}%</span>
                   </div>
                   <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div className={`h-full rounded-full transition-all duration-1000 ${getCpuBg(stats.cpu)}`} style={{ width: `${stats.cpu}%` }} />
                   </div>
                 </div>

                 <div>
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                     <span className="flex items-center gap-1"><MemoryStick size={12} className={getRamColor(stats.ram)} /> Pamięć RAM</span>
                     <span className="text-white">{stats.ram}%</span>
                   </div>
                   <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div className={`h-full rounded-full transition-all duration-1000 ${getRamBg(stats.ram)}`} style={{ width: `${stats.ram}%` }} />
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