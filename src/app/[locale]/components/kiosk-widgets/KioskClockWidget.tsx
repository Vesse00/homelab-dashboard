'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, Lock, Unlock, Clock } from 'lucide-react';

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
  w?: number;
  h?: number;
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
  const shortDays = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  const dayName = days[time.getDay()];
  const shortDayName = shortDays[time.getDay()];
  const day = time.getDate();
  const month = months[time.getMonth()];

  const fallbackHeight = `${Math.max(80, h * 40)}px`;

  // --- BARDZIEJ PRECYZYJNA DETEKCJA ROZMIARÓW ---
  const isTinyWidth = w <= 2;
  const isCompactWidth = w <= 3; // Np. w=3
  const isTinyHeight = h <= 1;
  const isCompactHeight = h <= 2;

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
      <Clock className="absolute -left-4 -bottom-4 w-32 h-32 text-blue-500 opacity-5 pointer-events-none transform rotate-12" />

      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-3xl cursor-move grid-drag-handle backdrop-blur-sm">
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
           <GripHorizontal className="text-blue-400 mb-1" size={24} />
           {!isTinyWidth && <span className="text-white font-bold tracking-wide text-xs">ZEGAR</span>}
        </div>
      )}

      {/* Marginesy maleją, gdy robi się ciaśniej */}
      <div className={`flex-1 flex flex-col items-center justify-center z-10 min-h-0 text-center ${isCompactHeight ? 'p-2' : 'p-4'}`}>
        
        {/* LEKKO POMNIEJSZONA GODZINA DLA LEPSZYCH PROPORCJI */}
        <span 
          style={{ fontSize: isTinyHeight ? 'min(40cqw, 70cqh)' : 'min(30cqw, 40cqh)' }} 
          className="leading-none font-black text-white tracking-tighter drop-shadow-lg"
        >
          {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        {/* DATA */}
        {!isTinyHeight && (
          <div 
            style={{ marginTop: 'min(2cqh, 0.5rem)' }} 
            className={`${isCompactWidth ? 'px-3 py-1' : 'px-5 py-1.5 sm:px-6 sm:py-2'} rounded-full bg-slate-800/60 border border-slate-600/50 shadow-inner flex items-center justify-center`}
          >
            {/* ZMNIEJSZONE `cqw/cqh` + DYNAMICZNY SKRÓT DATY */}
            <span 
              style={{ fontSize: isCompactWidth ? 'min(6cqw, 14cqh)' : 'min(4.5cqw, 10cqh)' }} 
              className="font-bold text-blue-400 tracking-widest uppercase whitespace-nowrap"
            >
              {isTinyWidth 
                ? `${day}.${(time.getMonth() + 1).toString().padStart(2, '0')}` // Np. 16.03
                : isCompactWidth 
                  ? `${shortDayName}, ${day} ${month.substring(0, 3)}` // Np. PON, 16 MAR
                  : `${dayName}, ${day} ${month}` // Pełna data
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}