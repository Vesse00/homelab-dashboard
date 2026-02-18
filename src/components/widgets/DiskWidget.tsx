'use client';

import { useState, useEffect } from 'react';
import { HardDrive, GripHorizontal, X } from 'lucide-react';

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
      } catch (e) {} finally { setLoading(false); }
    };
    fetchDisks();
  }, []);

  return (
    <div style={style} className={`${className} bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col overflow-hidden`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>
      
      {/* NAGŁÓWEK JAKO UCHWYT */}
      <div className={`
        flex items-center justify-between px-3 py-2 h-[40px] border-b border-slate-700/50
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

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? <div className="text-xs text-slate-500 animate-pulse">Skanowanie...</div> : 
          disks.map((disk, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-mono">{disk.mounted}</span>
                <span className="text-slate-400">{disk.used} GB / {disk.total} GB</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div className={`h-full transition-all duration-1000 ${parseInt(disk.capacity) > 90 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: disk.capacity }} />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}