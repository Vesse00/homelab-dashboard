'use client';

import { useState, useEffect } from 'react';
import { HardDrive, GripHorizontal, X, ArrowDownRight } from 'lucide-react';

interface DiskWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

export default function DiskWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove
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
    // Odświeżaj co 30 sekund
    const interval = setInterval(fetchDisks, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      style={style} 
      className={`${className} bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col overflow-hidden`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >

      {/* --- TRYB EDYCJI (Nakładka) --- */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={20} />
           </div>
           <GripHorizontal className="text-blue-400 mb-2" />
           <span className="text-white font-bold">Dyski Serwera</span>
           <span className="text-xs text-slate-400">disk</span>

           {/* --- IKONA SKALOWANIA (Prawy dolny róg) --- */}
            <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
              <ArrowDownRight size={16} />
            </div>
        </div>
      )}
      
      {/* NAGŁÓWEK */}
      <div className={`
        flex items-center justify-between px-3 py-2 h-[40px] border-b border-slate-700/50 flex-shrink-0
        ${isEditMode ? 'bg-slate-700/50 cursor-move grid-drag-handle' : 'bg-slate-900/50'}
      `}>
        <div className="flex items-center gap-2 w-full pointer-events-none">
          {isEditMode ? <GripHorizontal size={16} className="text-blue-400" /> : <HardDrive size={16} className="text-purple-400" />}
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dyski Serwera</span>
        </div>
        {isEditMode && (
          <div className="cursor-pointer text-slate-500 hover:text-red-400 z-50" onMouseDown={e => e.stopPropagation()} onClick={() => onRemove(id)}>
            <X size={16} />
          </div>
        )}
      </div>

      {/* TREŚĆ (Lista dysków) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
             <div className="h-8 bg-slate-700 rounded w-full"></div>
             <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          </div>
        ) : disks.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
             Brak widocznych dysków
           </div>
        ) : (
          disks.map((disk, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between text-xs mb-1.5 items-end">
                <div>
                  <span className="text-slate-200 font-bold font-mono mr-2">{disk.mounted}</span>
                  <span className="text-slate-500 text-[10px]">{disk.filesystem}</span>
                </div>
                {/* Nowe formatowanie: np. 1.2 TB / 4 TB */}
                <span className="text-slate-400 font-mono">
                  {disk.usedStr} / {disk.totalStr}
                </span>
              </div>
              
              {/* Pasek postępu */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700/50 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    disk.usagePercent > 90 ? 'bg-red-500' : 
                    disk.usagePercent > 75 ? 'bg-amber-500' : 
                    'bg-gradient-to-r from-blue-600 to-purple-500'
                  }`}
                  style={{ width: disk.capacity }} 
                />
              </div>
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}