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

  const fallbackHeight = `${Math.max(120, h * 40)}px`;

  // --- BARDZIEJ PRECYZYJNA DETEKCJA ROZMIARÓW ---
  const isTinyWidth = w <= 2;
  const isCompactWidth = w <= 3; // Np. w=3
  const isTinyHeight = h <= 1;
  const isCompactHeight = h <= 2;

  // Renderujemy datę tylko wtedy, gdy mamy wystarczająco dużo miejsca
  const showDate = h >= 2;

  return (
    <div
      style={{
        ...style,
        containerType: 'size',
        // usunięto fallbackHeight, polegamy na absolutnym wypełnieniu widżetu w kontenerze
      }}
      className={`absolute inset-0 backdrop-blur-2xl border rounded-3xl flex flex-col overflow-hidden transition-all duration-300 group bg-slate-900/70 border-slate-700/50 shadow-[0_8px_32px_rgba(2,6,23,0.6)] ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    >
      <Clock className={`absolute -right-6 -bottom-6 ${isCompactHeight ? 'w-24 h-24' : 'w-40 h-40'} text-blue-500 opacity-[0.03] pointer-events-none transform rotate-12`} />

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

      {/* Content area filled aggressively to take max space with tiny logical paddings based on container size */}
      <div className="flex flex-col items-center justify-center w-full h-full p-[2cqmin] z-10">
        <span
          style={{
            // Dynamiczne font-size: czas zajmuje zawsze niemal cały ekran.
            // max-width of '00:00' is roughly ~3em, tak więc max ~30cqw.
            fontSize: showDate ? 'min(30cqw, 60cqh)' : 'min(32cqw, 85cqh)',
            lineHeight: 0.85
          }}
          className="font-black text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10"
        >
          {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Date badge */}
        {showDate && (
          <div 
            style={{ marginTop: 'min(3cqh, 12px)' }}
            className={`${isCompactWidth ? 'px-3 py-1' : 'px-5 py-1.5'} rounded-full bg-slate-800/50 border border-slate-700/40 shadow-inner flex items-center justify-center z-10`}
          >
            <span 
              style={{ fontSize: isCompactWidth ? 'min(6cqw, 12cqh)' : 'min(4.5cqw, 10cqh)' }} 
              className="font-bold text-blue-400 tracking-widest uppercase whitespace-nowrap"
            >
              {isTinyWidth
                ? `${day}.${(time.getMonth() + 1).toString().padStart(2, '0')}` // Krótka data
                : isCompactWidth
                  ? `${shortDayName}, ${day} ${month.substring(0, 3)}` // Średnia data
                  : `${dayName}, ${day} ${month}` // Pełna data
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}