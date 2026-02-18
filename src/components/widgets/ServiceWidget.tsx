'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, ExternalLink } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Importujemy nasze szablony
import MinecraftWidget from './templates/MinecraftWidget';
import PiholeWidget from './templates/PiholeWidget';
import MediaWidget from './templates/MediaWidget';
import AdminWidget from './templates/AdminWidget';
import ProxyWidget from './templates/ProxyWidget';

interface ServiceWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  data: {
    name: string;
    icon: string;
    url: string;
    color: string;
    status: string;
    widgetType?: string; // Tutaj przychodzi typ z appMap
  };
}

export default function ServiceWidget(props: ServiceWidgetProps) {
  const { style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, data } = props;
  console.log("ServiceWidget Data:", data.name, data.widgetType);
  
  // Stan na statystyki "Live" z Dockera
  const [stats, setStats] = useState<{ cpuUsage: string, memoryUsage: string } | null>(null);

  if (true) { 
    return (
      <div style={style} className={`${className} bg-slate-800 text-xs overflow-hidden border-2 border-red-500 relative`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>
         <div className="absolute top-0 left-0 bg-red-600 text-white px-2 font-bold z-50">DEBUG MODE</div>
         <div className="p-4 pt-8 text-white space-y-1 font-mono break-all">
            <p><span className="text-slate-400">Name:</span> {data.name}</p>
            <p><span className="text-slate-400">Type:</span> <span className="text-yellow-400 font-bold">'{data.widgetType}'</span></p>
            <p><span className="text-slate-400">Icon:</span> {data.icon}</p>
            <button onClick={() => onRemove(id)} className="mt-2 bg-red-600 px-2 py-1 rounded">Usuń mnie</button>
         </div>
      </div>
    );
  }

  // Pobieranie statystyk (Proste fetchowanie po nazwie, jeśli mamy API)
  // UWAGA: To zadziała dobrze, jeśli 'data.name' w miarę odpowiada nazwie kontenera lub jeśli dodamy containerId do data
  // Na razie zrobimy prostą symulację lub placeholder, a w przyszłości wepniemy tu containerId
  useEffect(() => {
    // Tu w przyszłości: fetch('/api/stats/' + data.containerId)
    // Na razie zostawmy null, szablony obsłużą brak danych
  }, []);

  

  // --- WYBÓR SZABLONU ---
  const renderContent = () => {
    switch (data.widgetType) {
      case 'minecraft':
        return <MinecraftWidget data={data} stats={stats} />;
      case 'pihole':
        return <PiholeWidget data={data} stats={stats} />;
      case 'media':
        return <MediaWidget data={data} stats={stats} />;
      case 'admin':  
        return <AdminWidget data={data} stats={stats} />;
      case 'proxy':  
        return <ProxyWidget data={data} />;
      default:
        return <GenericTemplate data={data} />;
    }
  };

  return (
    <div 
      style={style} 
      className={`${className} rounded-xl shadow-xl flex flex-col overflow-hidden relative group`} 
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
           <span className="text-white font-bold">{data.name}</span>
           <span className="text-xs text-slate-400">{data.widgetType || 'generic'}</span>
        </div>
      )}

      {/* --- WŁAŚCIWY SZABLON --- */}
      <div className="h-full w-full">
         {renderContent()}
      </div>
    </div>
  );
}

// Domyślny wygląd (taki jak miałeś wcześniej)
function GenericTemplate({ data }: any) {
  // @ts-ignore
  const IconComponent = LucideIcons[data.icon] || LucideIcons.Box;
  
  // Mapowanie kolorów
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500', red: 'bg-red-500', green: 'bg-emerald-500',
    blue: 'bg-blue-600', sky: 'bg-sky-500', purple: 'bg-purple-600',
    slate: 'bg-slate-500', emerald: 'bg-emerald-600',
  };
  const bgClass = colorMap[data.color] || 'bg-slate-600';

  return (
    <div className="h-full w-full bg-slate-800 border border-slate-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 ${bgClass} blur-2xl rounded-full scale-150 translate-y-4`} />
        
        <IconComponent size={32} className="text-white z-10 drop-shadow-lg mb-2" />
        <span className="text-sm font-bold text-slate-200 z-10 text-center">{data.name}</span>
        
        <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseDown={e => e.stopPropagation()} 
            className={`
              mt-2 flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 z-10
              ${bgClass}
            `}
          >
            Otwórz <ExternalLink size={10}/>
        </a>
    </div>
  );
}