'use client';

import { useState, useEffect } from 'react';
import { GripHorizontal, X, ExternalLink, Settings, Save, ArrowDownRight, Lock, Unlock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Importujemy nasze szablony
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
  data: {
    name: string;
    icon: string;
    url: string;
    color: string;
    status: string;
    widgetType?: string; // Tutaj przychodzi typ z appMap
    settings?: {
      authType?: string;
      apiKey?: string;
      username?: string;
      password?: string;
      statusPage?: string; // Specjalne ustawienie dla Uptime Kuma
    };
  };
  w?: number; // Szerokość w gridzie
  h?: number; // Wysokość w gridzie
  isLocked?: boolean; // Czy widget jest zablokowany przed przenoszeniem/skalowaniem
  onToggleLock?: (id: string) => void;
  
}

export default function ServiceWidget(props: ServiceWidgetProps) {
  const { style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove, onUpdateData,w, h, data, isLocked, onToggleLock } = props;

  // --- ZABEZPIECZENIE PRZED BRAKIEM DANYCH ---
  if (!data) {
    return (
      <div style={style} className={`${className} bg-red-900/50 border border-red-500 rounded-xl p-4 flex flex-col items-center justify-center`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>
         <span className="text-white font-bold">Błąd wczytywania danych</span>
         <button onClick={() => onRemove(id)} className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">Usuń uszkodzony widget</button>
      </div>
    );
  }

  console.log("ServiceWidget Data:", data.name, data.widgetType);
  
  // Stan na statystyki "Live" z Dockera
  const [stats, setStats] = useState<{ cpuUsage: string, memoryUsage: string } | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [settings, setSettings] = useState({
    authType: data.settings?.authType || 'none', // 'none', 'apikey', 'basic'
    apiKey: data.settings?.apiKey || '',
    username: data.settings?.username || '',
    password: data.settings?.password || '',
    statusPage: data.settings?.statusPage || '' // Specjalne ustawienie dla Uptime Kuma
  });
  const [editedUrl, setEditedUrl] = useState(data.url || '');

  // Stan na statystyki "Live"
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  
  // Pobieranie statystyk (Proste fetchowanie po nazwie, jeśli mamy API)
  // UWAGA: To zadziała dobrze, jeśli 'data.name' w miarę odpowiada nazwie kontenera lub jeśli dodamy containerId do data
  // Na razie zrobimy prostą symulację lub placeholder, a w przyszłości wepniemy tu containerId
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      // Jeśli widget nie ma przypisanego typu lub URL, nie ma sensu pytać API
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
            settings: data.settings // Przekazujemy zapisane hasła do backendu!
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

    fetchStats(); // Pobierz natychmiast po załadowaniu
    const interval = setInterval(fetchStats, 15000); // Odświeżaj co 15 sekund

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [data.url, data.settings, data.name, data.widgetType]); // Zależności: odśwież, jeśli user zmieni hasło w zębatce

  

  // --- WYBÓR SZABLONU ---
  const renderContent = () => {
    const templateProps = { data, stats: liveStats, isLoading, w, h }; // <-- ZBIERAMY PROPSY

    switch (data.widgetType) {
      case 'minecraft':
        return <MinecraftWidget {...templateProps} />;
      case 'pihole':
        return <PiholeWidget {...templateProps} />;
      case 'media':
        return <MediaWidget {...templateProps} />;
      case 'admin':  
        return <AdminWidget {...templateProps} />;
      case 'proxy':  
        return <ProxyWidget {...templateProps} />;
      case 'home-assistant':
        return <HomeAssistantWidget {...templateProps} />;
      case 'uptime-kuma':
        return <UptimeKumaWidget {...templateProps} />;
      case 'tailscale':
        return <TailscaleWidget {...templateProps} />;
      case 'vaultwarden':
        return <VaultwardenWidget {...templateProps} />;
      default:
        return <GenericTemplate data={data} stats={liveStats} />;
    }
  };

  return (
    <div 
      style={style} 
      className={`h-full w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col relative overflow-hidden group ${className}`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      {/* --- TRYB EDYCJI (Nakładka) --- */}
      {isEditMode && !isConfiguring && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle">
           <div 
             className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 transition-colors ${isLocked ? 'text-amber-400 bg-slate-800/90 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800'}`} 
             onMouseDown={(e) => e.stopPropagation()} 
             onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
           >
             {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
           </div>
           {/* Prawy górny róg - akcje */}
            <div className="absolute top-2 right-2 flex gap-2 z-50">
              <button 
                className="text-slate-400 hover:text-emerald-400 bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={(e) => { e.stopPropagation(); setIsConfiguring(true); }}
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

           {/* --- IKONA SKALOWANIA (Prawy dolny róg) --- */}
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {/* --- PANEL KONFIGURACJI WIDGETU --- */}
      {isConfiguring && (
        <div className="absolute inset-0 bg-slate-900 z-[60] p-4 flex flex-col rounded-xl border-2 border-emerald-500 shadow-2xl overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-bold flex items-center gap-2"><Settings size={16} className="text-emerald-400"/> Ustawienia</h4>
              <button onClick={() => setIsConfiguring(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
           </div>
           
           <div className="flex-1 space-y-3">
              {/* NOWE POLE: Adres URL */}
              <div>
                 <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Adres URL Aplikacji</label>
                 <input 
                   type="text" 
                   value={editedUrl}
                   onChange={(e) => setEditedUrl(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                 />
              </div>

              {/* --- SPECJALNE POLE DLA UPTIME KUMA --- */}
              {data.widgetType === 'uptime-kuma' && (
                <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                   <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 block">Slug Strony Statusu</label>
                   <input 
                     type="text" 
                     value={settings.statusPage}
                     onChange={(e) => handleSettingChange('statusPage', e.target.value)}
                     placeholder="np. default albo moja-strona"
                     className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none mb-1"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">Jeśli Twój adres to <span className="text-slate-300 font-mono">/status/serwery</span>, wpisz wyżej słowo <span className="text-emerald-400 font-mono font-bold">serwery</span>.</p>
                </div>
              )}

              {/* Wybór typu autoryzacji */}
              <div>
                 <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Typ autoryzacji</label>
                 <select 
                   value={settings.authType}
                   onChange={(e) => handleSettingChange('authType', e.target.value)}
                   className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                 >
                    <option value="none">Brak (Publiczne API)</option>
                    <option value="apikey">Token / API Key</option>
                    <option value="basic">Login i Hasło (Basic Auth)</option>
                 </select>
              </div>

              {/* Pola dla API Key */}
              {settings.authType === 'apikey' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Klucz API</label>
                   <input 
                     type="password" 
                     value={settings.apiKey}
                     onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                     className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                   />
                </div>
              )}

              {/* Pola dla Login i Hasło */}
              {settings.authType === 'basic' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <div>
                     <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Login</label>
                     <input 
                       type="text" 
                       value={settings.username}
                       onChange={(e) => handleSettingChange('username', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                     />
                   </div>
                   <div>
                     <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Hasło</label>
                     <input 
                       type="password" 
                       value={settings.password}
                       onChange={(e) => handleSettingChange('password', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                     />
                   </div>
                </div>
              )}
           </div>

           <button 
             onClick={() => {
               // Zapisujemy stare dane widgetu + dorzucamy nasze nowe settings (login/hasło/apikey)
               if (onUpdateData) {
                 onUpdateData(id, {
                   ...data,
                   settings: settings,
                   url: editedUrl // Aktualizujemy też URL, który jest kluczowy do pobierania statystyk 
                 });
               }
               setIsConfiguring(false);
             }}
             className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
           >
             <Save size={16} /> Zapisz
           </button>
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
function GenericTemplate({ data, stats }: any) {
  // @ts-ignore
  const IconComponent = LucideIcons[data.icon] || LucideIcons.Box;
  
  const isOnline = stats?.status === 'online';
  const isError = stats?.status === 'error';

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
        
        {/* WIDOK BŁĘDU (Styl Pi-hole wyśrodkowany) */}
        {isError && stats && (
           <div className="flex flex-col items-center mt-3 z-10 animate-in fade-in duration-500">
             <span className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-md text-center">{stats.primaryText}</span>
             <span className="text-xs text-slate-400 font-mono mt-1 text-center" title={stats.secondaryText}>
               {stats.secondaryText}
             </span>
           </div>
        )}
        
        {/* WIDOK NORMALNY */}
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
            href={data.url} 
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