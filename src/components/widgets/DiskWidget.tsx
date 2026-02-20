'use client';

import { useState, useEffect } from 'react';
import { HardDrive, GripHorizontal, X, ArrowDownRight, Server } from 'lucide-react';

interface DiskWidgetProps {
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
}

export default function DiskWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, w = 2, h = 2
}: DiskWidgetProps) {
  const [disks, setDisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisks = async () => {
      try {
        const res = await fetch('/api/system/disks');
        const data = await res.json();
        if (Array.isArray(data)) setDisks(data);
      } catch (e) {
        console.error(e);
      } finally { 
        setLoading(false); 
      }
    };
    fetchDisks();
    const interval = setInterval(fetchDisks, 30000); 
    return () => clearInterval(interval);
  }, []);

  const isExpanded = w >= 3 && h >= 3;
  // W trybie kompaktowym pokazujemy max 2 partycje, w rozszerzonym - wszystkie
  const displayDisks = isExpanded ? disks : disks.slice(0, 2);

  return (
    <div 
      style={style} 
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden group transition-all duration-300 ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      {/* Gigantyczna ikona w tle */}
      <HardDrive className="absolute -right-10 -bottom-10 w-48 h-48 text-purple-400 opacity-[0.03] pointer-events-none transform -rotate-12 transition-all duration-500" />
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* --- TRYB EDYCJI --- */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle backdrop-blur-sm">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg" onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={18} />
           </div>
           <GripHorizontal className="text-blue-400 mb-2 drop-shadow-lg" size={28} />
           <span className="text-white font-bold tracking-wide">Dyski Serwera</span>
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}
      
      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 z-10">
        <div className="flex items-center gap-3 w-full pointer-events-none">
          <div className="p-2 rounded-xl bg-slate-950/50 border border-white/5 text-purple-400 shadow-inner">
             <HardDrive size={20} />
          </div>
          <div>
             <span className="text-sm font-bold text-slate-200 block leading-tight">Przestrzeń</span>
             <span className="text-[10px] text-slate-500 font-mono">system-disks</span>
          </div>
        </div>
      </div>

      {/* TREŚĆ */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar z-10">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse mt-2">
             <div className="h-10 bg-white/5 rounded-lg w-full"></div>
             <div className="h-10 bg-white/5 rounded-lg w-3/4"></div>
          </div>
        ) : disks.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">Brak widocznych dysków</div>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col gap-3.5">
             {displayDisks.map((disk, idx) => (
               <div key={idx} className="group/disk">
                 <div className="flex justify-between text-xs mb-1.5 items-end">
                   <div className="flex items-center gap-2">
                     <Server size={12} className="text-purple-400" />
                     <span className="text-slate-200 font-bold font-mono">{disk.mounted}</span>
                   </div>
                   <span className="text-slate-400 font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                     {disk.usedStr} / {disk.totalStr}
                   </span>
                 </div>
                 
                 <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor] opacity-80 group-hover/disk:opacity-100 ${
                       disk.usagePercent > 90 ? 'bg-red-500' : 
                       disk.usagePercent > 75 ? 'bg-amber-500' : 
                       'bg-purple-500'
                     }`}
                     style={{ width: disk.capacity }} 
                   />
                 </div>
               </div>
             ))}
             
             {!isExpanded && disks.length > 2 && (
               <div className="text-center text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                 <ArrowDownRight size={12}/> Rozwiń, by zobaczyć więcej ({disks.length - 2})
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}