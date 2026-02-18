'use client';

import { useState, useEffect } from 'react';
import { X, GripHorizontal, Activity, Server, ExternalLink } from 'lucide-react';
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
}

export default function DockerWidget({
  style,
  className,
  onMouseDown,
  onMouseUp,
  onTouchEnd,
  id,
  title,
  isEditMode,
  onRemove,
}: DockerWidgetProps) {
  const router = useRouter();
  
  // Stan na dane z API
  const [data, setData] = useState({ running: 0, total: 0, uptime: '0.00' });
  const [loading, setLoading] = useState(true);

  // Pobieranie danych co 5 sekund
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/docker/stats');
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (error) {
        console.error("Widget fetch error", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Odświeżanie
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={style}
      className={`${className} bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col transition-all duration-200`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    >
      {/* --- NAGŁÓWEK --- */}
      <div className={`
        flex items-center justify-between px-3 py-2 h-[40px] border-b border-slate-700/50
        ${isEditMode ? 'bg-slate-700/50 cursor-move grid-drag-handle' : 'bg-slate-900/50'}
      `}>
        <div className="flex items-center gap-2 w-full overflow-hidden">
          {isEditMode ? (
            <div className=" text-blue-400 hover:text-white cursor-grab active:cursor-grabbing">
              <GripHorizontal size={16} />
            </div>
          ) : (
            <Activity size={16} className="text-blue-400" />
          )}
          
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider truncate select-none">
            {title}
          </span>
        </div>

        {isEditMode && (
          <div
            className="cursor-pointer text-slate-500 hover:text-red-400 transition-colors p-1"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
          >
            <X size={16} />
          </div>
        )}
      </div>

      {/* --- TREŚĆ --- */}
      <div className="flex-1 p-5 flex flex-col justify-between relative">
        {loading ? (
           <div className="animate-pulse flex flex-col gap-2">
             <div className="h-8 bg-slate-700 rounded w-1/2"></div>
             <div className="h-4 bg-slate-700 rounded w-full"></div>
           </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Kontenery</p>
                <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                  {data.running}
                  <span className="text-slate-500 text-lg">/ {data.total}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Uptime</p>
                <div className="text-lg font-mono font-medium text-emerald-400">
                  {data.uptime}%
                </div>
              </div>
            </div>

            {/* Pasek postępu */}
            <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden border border-slate-700/50">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(data.running / (data.total || 1)) * 100}%` }}
              />
            </div>

            {/* Przycisk akcji na dole widgetu */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                {/* W trybie edycji przycisk jest nieaktywny, żeby nie przeszkadzał */}
               <button
                  onMouseDown={(e) => e.stopPropagation()} // Stop propagation dla drag&drop
                  onClick={() => !isEditMode && router.push('/containers')}
                  className={`
                    flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                    ${isEditMode 
                        ? 'opacity-50 cursor-default border-slate-700 text-slate-500' 
                        : 'border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 cursor-pointer'
                    }
                  `}
               >
                 <span>Szczegóły</span>
                 <ExternalLink size={12} />
               </button>
            </div>
          </>
        )}
        
        {/* Nakładka w trybie edycji, żeby nie klikać przycisków przypadkiem */}
        {isEditMode && <div className="absolute inset-0 z-10 bg-transparent" />}
      </div>
    </div>
  );
}