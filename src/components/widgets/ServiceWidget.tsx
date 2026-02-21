'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, ExternalLink, Settings, ArrowDownRight, Lock, Unlock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Import modalu i szablonów
import EditWidgetModal from './EditWidgetModal'; // <--- IMPORT NASZEGO NOWEGO MODALU
import MinecraftWidget from './templates/MinecraftWidget';
import PiholeWidget from './templates/PiholeWidget';
import MediaWidget from './templates/MediaWidget';
import AdminWidget from './templates/AdminWidget';
import ProxyWidget from './templates/ProxyWidget';
import HomeAssistantWidget from './templates/HomeAssistantWidget';
import UptimeKumaWidget from './templates/UptimeKumaWidget';
import TailscaleWidget from './templates/TailscaleWidget';
import VaultwardenWidget from './templates/VaultwardenWidget';

interface ServiceWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onUpdateData?: (id: string, newData: any) => void;
  data: any;
  w?: number;
  h?: number;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
}

export default function ServiceWidget(props: ServiceWidgetProps) {
  const { style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, onUpdateData, w, h, data, isLocked, onToggleLock } = props;

  if (!data) {
    return (
      <div style={style} className={`${className} bg-red-900/50 border border-red-500 rounded-xl p-4 flex flex-col items-center justify-center`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>
         <span className="text-white font-bold">Błąd wczytywania danych</span>
         <button onClick={() => onRemove(id)} className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">Usuń uszkodzony widget</button>
      </div>
    );
  }

  // --- TYLKO JEDEN STAN DO OBSŁUGI MODALU ---
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Stan na statystyki "Live"
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      if (!data.url || !data.widgetType || data.widgetType === 'generic') {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/services/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appName: data.name,
            url: data.url,
            widgetType: data.widgetType,
            settings: data.settings
          })
        });

        const result = await res.json();
        
        if (isMounted) {
          setLiveStats(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLiveStats({ status: 'error', primaryText: 'Błąd połączenia', secondaryText: 'Sprawdź logi' });
          setIsLoading(false);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [data.url, data.settings, data.name, data.widgetType]);

  const renderContent = () => {
    // 1. WALIDACJA: Jeśli publicUrl istnieje i nie jest pusty -> używamy go. W przeciwnym razie bierzemy lokalny url (IP:port).
    let finalClickUrl = (data.publicUrl && data.publicUrl.trim() !== '') ? data.publicUrl : data.url;

    // 2. ZABEZPIECZENIE: Jeśli link nie ma http:// lub https:// na początku, doklejamy http://
    if (finalClickUrl && !/^https?:\/\//i.test(finalClickUrl)) {
      finalClickUrl = `http://${finalClickUrl}`;
    }

    // 3. PRZEKAZUJEMY: Tworzymy ulepszony obiekt data z naszym gotowym linkiem `clickUrl`
    const enhancedData = { ...data, clickUrl: finalClickUrl };
    const templateProps = { data: enhancedData, stats: liveStats, isLoading, w, h };

    switch (data.widgetType) {
      case 'minecraft': return <MinecraftWidget {...templateProps} />;
      case 'pihole': return <PiholeWidget {...templateProps} />;
      case 'media': return <MediaWidget {...templateProps} />;
      case 'admin': return <AdminWidget {...templateProps} />;
      case 'proxy': return <ProxyWidget {...templateProps} />;
      case 'home-assistant': return <HomeAssistantWidget {...templateProps} />;
      case 'uptime-kuma': return <UptimeKumaWidget {...templateProps} />;
      case 'tailscale': return <TailscaleWidget {...templateProps} />;
      case 'vaultwarden': return <VaultwardenWidget {...templateProps} />;
      default: return <GenericTemplate data={data} stats={liveStats} />;
    }
  };

  return (
    <>
      <div 
        style={style} 
        className={`h-full w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col relative overflow-hidden group ${className}`} 
        onMouseDown={onMouseDown} 
        onMouseUp={onMouseUp} 
        onTouchEnd={onTouchEnd}
      >
        {/* --- NAKŁADKA TRYBU EDYCJI --- */}
        {isEditMode && (
          <div className="absolute inset-0 bg-slate-900/80 z-[40] flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle">
             <div 
               className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 transition-colors ${isLocked ? 'text-amber-400 bg-slate-800/90 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800'}`} 
               onMouseDown={(e) => e.stopPropagation()} 
               onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
             >
               {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
             </div>
              <div className="absolute top-2 right-2 flex gap-2 z-50">
                <button 
                  className="text-slate-400 hover:text-emerald-400 bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                  onMouseDown={(e) => e.stopPropagation()} 
                  onClick={(e) => { e.stopPropagation(); setIsConfiguring(true); }} // <--- OTWIERA MODAL
                >
                  <Settings size={18} />
                </button>
                <button 
                  className="text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                  onMouseDown={(e) => e.stopPropagation()} 
                  onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                >
                  <X size={18} />
                </button>
              </div>
             
             <GripHorizontal className="text-blue-400 mb-2" />
             <span className="text-white font-bold">{data.name}</span>
             <span className="text-xs text-slate-400">{data.widgetType || 'generic'}</span>

             <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
               <ArrowDownRight size={16} />
             </div>
          </div>
        )}

        {/* WŁAŚCIWY SZABLON */}
        <div className="h-full w-full">
           {renderContent()}
        </div>
      </div>

      {/* --- WYWOŁANIE ZEWNĘTRZNEGO MODALU --- */}
      {isConfiguring && (
        <EditWidgetModal 
          id={id}
          data={data}
          onClose={() => setIsConfiguring(false)}
          onUpdateData={onUpdateData}
        />
      )}
    </>
  );
}

// Domyślny wygląd z obsługą clickUrl
function GenericTemplate({ data, stats }: any) {
  // @ts-ignore
  const IconComponent = LucideIcons[data.icon] || LucideIcons.Box;
  
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';

  // Otwiera URL z Nginxa, albo jeśli nie wpisano, to domyślne lokalne
  const clickUrl = data.publicUrl || data.url;

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500', red: 'bg-red-500', green: 'bg-emerald-500',
    blue: 'bg-blue-600', sky: 'bg-sky-500', purple: 'bg-purple-600',
    slate: 'bg-slate-500', emerald: 'bg-emerald-600',
  };
  
  let bgClass = colorMap[data.color] || 'bg-slate-600';
  let iconColorClass = 'text-white';
  let containerBg = 'bg-slate-800 border-slate-700';

  if (isOnline) {
     containerBg = 'bg-slate-900/60 backdrop-blur-md border-slate-700/50';
  } else if (isError) {
     containerBg = 'bg-red-950/40 backdrop-blur-md border-red-900/50';
     iconColorClass = 'text-red-500';
     bgClass = 'bg-red-500';
  }

  return (
    <div className={`h-full w-full ${containerBg} border flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 rounded-2xl`}>
        <div className={`absolute inset-0 opacity-20 ${bgClass} blur-2xl rounded-full scale-150 translate-y-4 pointer-events-none`} />
        
        <IconComponent size={32} className={`z-10 drop-shadow-lg mb-2 ${iconColorClass}`} />
        <span className="text-sm font-bold text-slate-200 z-10 text-center">{data.name}</span>
        
        {isError && stats && (
           <div className="flex flex-col items-center mt-3 z-10 animate-in fade-in duration-500">
             <span className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md text-center">{stats.primaryText}</span>
             <span className="text-xs text-slate-400 font-mono mt-1 text-center" title={stats.secondaryText}>
               {stats.secondaryText}
             </span>
           </div>
        )}
        
        {isOnline && stats && (
           <div className="flex flex-col items-center mt-1 z-10 animate-in fade-in duration-500">
             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
               {stats.primaryText}
             </span>
             <span className="text-[9px] max-w-[120px] text-center truncate text-slate-400" title={stats.secondaryText}>
               {stats.secondaryText}
             </span>
           </div>
        )}
        
        <a 
            href={data.clickUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseDown={e => e.stopPropagation()} 
            className={`
              mt-2 flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 z-10
              ${isError ? 'bg-red-600/50 hover:bg-red-600/70 border border-red-500/50' : (colorMap[data.color] || 'bg-slate-600')}
            `}
          >
            Otwórz <ExternalLink size={10}/>
        </a>
    </div>
  );
}