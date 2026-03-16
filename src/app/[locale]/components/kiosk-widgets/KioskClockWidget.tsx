'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, Lock, Unlock, ArrowDownRight, Clock } from 'lucide-react';

interface KioskClockWidgetProps {
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
  w?: number; // <--- Odbieramy szerokość z grida
  h?: number; // <--- Odbieramy wysokość z grida
}

export default function KioskClockWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, isLocked, onToggleLock, w = 12, h = 4
}: KioskClockWidgetProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  const dayName = days[time.getDay()];
  const day = time.getDate();
  const month = months[time.getMonth()];

  // DYNAMICZNE SKALOWANIE WZGLĘDEM KOLUMN GRIDA (w)
  const getTimeSize = (width: number) => {
    if (width <= 4) return 'text-4xl';
    if (width <= 6) return 'text-6xl';
    if (width <= 9) return 'text-8xl';
    return 'text-[9rem]'; // Potężny rozmiar dla w=12
  };

  const getDateSize = (width: number) => {
    if (width <= 4) return 'text-sm';
    if (width <= 6) return 'text-lg';
    if (width <= 9) return 'text-2xl';
    return 'text-3xl';
  };

  return (
    <div 
      style={style} 
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 h-full w-full ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      <Clock className="absolute -left-8 -bottom-8 w-48 h-48 text-blue-500 opacity-5 pointer-events-none transform rotate-12" />

      {/* Tryb Edycji (bez zmian) */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle backdrop-blur-sm">
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
           <GripHorizontal className="text-blue-400 mb-2" size={28} />
           <span className="text-white font-bold tracking-wide">ZEGAR KIOSK</span>
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {/* Skalowana Treść */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 min-h-0 p-4 text-center">
        <span className={`${getTimeSize(w)} leading-none font-black text-white tracking-widest font-mono drop-shadow-md transition-all duration-300`}>
          {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`${getDateSize(w)} mt-2 md:mt-4 font-bold text-slate-400 tracking-widest uppercase transition-all duration-300`}>
          {dayName}, {day} {month}
        </span>
      </div>
    </div>
  );
}