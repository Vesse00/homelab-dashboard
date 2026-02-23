'use client';

import { useState, useEffect } from 'react';
import { X, GripHorizontal, Activity, Server, ExternalLink, ArrowDownRight, Play, Square, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface DockerWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  title: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  children?: ReactNode;
  w?: number;
  h?: number;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
}

export default function DockerWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, title, isEditMode, onRemove, w = 2, h = 2,isLocked, onToggleLock
}: DockerWidgetProps) {
  const router = useRouter();
  const [data, setData] = useState({ running: 0, total: 0, uptime: '0.00' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/docker/stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Widget fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const isExpanded = w >= 3 && h >= 3;
  const stopped = data.total - data.running;
  const runningPercent = data.total > 0 ? Math.round((data.running / data.total) * 100) : 0;
  const chartGradient = `conic-gradient(#10b981 ${runningPercent}%, #334155 0)`;

  return (
    <div
      style={style}
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 ${className}`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    >
      <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-blue-400 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500" />
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

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
           <GripHorizontal className="text-blue-400 mb-2 drop-shadow-lg" size={28} />
           <span className="text-white font-bold tracking-wide">Docker</span>
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 z-10">
        <div className="flex items-center gap-3 w-full pointer-events-none">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 text-blue-400 shadow-inner">
             <Activity size={18} />
          </div>
          <div>
             <span className="text-sm font-bold text-slate-200 block leading-tight">{title}</span>
             <span className="text-[10px] text-slate-500 font-mono">local-engine</span>
          </div>
        </div>
      </div>

      {/* TREŚĆ - Zmienione paddingi (p-4 zamiast p-5) */}
      <div className="flex-1 p-4 flex flex-col relative z-10">
        {loading ? (
           <div className="animate-pulse flex flex-col gap-3">
             <div className="h-10 bg-white/5 rounded-lg w-1/2"></div>
             <div className="h-4 bg-white/5 rounded-full w-full mt-4"></div>
           </div>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
            
            {!isExpanded && (
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-3xl font-black text-white flex items-baseline gap-1 drop-shadow-md">
                    {data.running} <span className="text-slate-500 text-lg font-bold">/ {data.total}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Aktywne</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    {data.uptime}%
                  </div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Uptime</p>
                </div>
              </div>
            )}

            {!isExpanded && (
              <div className="w-full bg-black/40 h-2 rounded-full mb-3 overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${runningPercent}%` }} />
              </div>
            )}

            {/* WERSJA ROZSZERZONA */}
            {isExpanded && (
              <div className="flex flex-col items-center justify-center flex-1 w-full animate-in zoom-in-95 duration-500 mb-3">
                  <div className="flex items-center justify-center gap-8 w-full">
                     <div className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ background: chartGradient }}>
                        <div className="w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner border border-white/5">
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Health</span>
                           <span className="text-2xl font-black text-white">{runningPercent}%</span>
                        </div>
                     </div>
                     <div className="flex flex-col gap-3 flex-1">
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                           <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1"><Play size={10} className="text-emerald-500"/> Działa</span>
                           <span className="text-lg text-white font-mono font-black">{data.running}</span>
                        </div>
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                           <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1"><Square size={10} className="text-slate-500"/> Zatrzymane</span>
                           <span className="text-lg text-white font-mono font-black">{stopped}</span>
                        </div>
                     </div>
                  </div>
              </div>
            )}

            {/* Przycisk akcji - mt-auto wypycha go na sam dół, pt-3 zyskuje trochę miejsca */}
            <div className="mt-auto pt-3 border-t border-white/10 flex justify-end">
               <button onMouseDown={(e) => e.stopPropagation()} onClick={() => !isEditMode && router.push('/containers')}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-lg border transition-all shadow-lg ${isEditMode ? 'opacity-50 cursor-default border-white/5 text-slate-500 bg-black/20' : 'border-white/10 text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 bg-blue-500/10 cursor-pointer'}`}
               >
                 <span>Zarządzaj</span>
                 <ExternalLink size={14} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}