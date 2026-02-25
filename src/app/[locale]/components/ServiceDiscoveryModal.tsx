'use client';

import { useState, useEffect } from 'react';
import { X, Radar, Check, Server, Globe, Box } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DiscoveredService {
  id: string;
  name: string;
  icon: string;
  ip: string;
  port: number;
  color: string;
  selected: boolean;
  widgetType?: string; 
}

interface ServiceDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (services: any[]) => void;
  initialServices: any[];
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  slate: 'bg-slate-500/10 border-slate-500/20 text-slate-500',
  red: 'bg-red-500/10 border-red-500/20 text-red-500',
  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
};

export default function ServiceDiscoveryModal({ isOpen, onClose, onImport, initialServices }: ServiceDiscoveryModalProps) {
  const [services, setServices] = useState<DiscoveredService[]>([]);
  const t = useTranslations('ServiceDiscovery');

  useEffect(() => {
    if (isOpen && initialServices.length > 0) {
      const mapped = initialServices.map((s: any, idx: number) => {
        let ip = 'localhost';
        let port = 80;

        try {
          const urlObj = new URL(s.url);
          ip = urlObj.hostname;
          port = parseInt(urlObj.port) || 80;
        } catch (e) {}

        return {
          id: `scan-${idx}-${Date.now()}`,
          name: s.name,
          icon: s.icon,
          ip: ip,
          port: port,
          color: s.color,
          selected: true,
          widgetType: s.widgetType 
        };
      });
      // @ts-ignore
      setServices(mapped);
    }
  }, [isOpen, initialServices]);

  const handleImport = () => {
    const finalData = services
      .filter(s => s.selected)
      .map(s => ({
        name: s.name,
        icon: s.icon,
        url: `http://${s.ip}:${s.port}`,
        color: s.color,
        status: 'running',
        widgetType: s.widgetType
      }));
      
    onImport(finalData);
    onClose();
  };

  const updatePort = (id: string, newPort: string) => {
    setServices(prev => prev.map(s => 
        s.id === id ? { ...s, port: parseInt(newPort) || 0 } : s
    ));
  };

  const toggleSelect = (id: string) => {
    setServices(prev => prev.map(s => 
        s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  if (!isOpen) return null;

  const selectedCount = services.filter(s => s.selected).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
      
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col mt-16 overflow-hidden">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radar className="text-purple-400" /> {t('title')}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {t('subtitle', { count: services.length })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {services.map((service) => {
               // @ts-ignore
               const Icon = LucideIcons[service.icon] || Box;
               const colorStyle = COLOR_MAP[service.color] || COLOR_MAP.slate;

               return (
                 <div 
                   key={service.id} 
                   className={`bg-slate-900 border rounded-2xl p-5 flex flex-col relative transition-all group ${
                     service.selected 
                       ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50' 
                       : 'border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                   }`}
                 >
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        type="button"
                        onClick={() => toggleSelect(service.id)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                          service.selected ? 'bg-blue-600 border-blue-600' : 'border-slate-600 hover:border-slate-400 bg-slate-950'
                        }`}
                      >
                        {service.selected && <Check size={14} className="text-white" />}
                      </button>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                       <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorStyle}`}>
                          <Icon size={24} />
                       </div>
                       <div className="flex-1 pr-8">
                          <h3 className="font-bold text-white text-lg truncate" title={service.name}>
                            {service.name}
                          </h3>
                          <div className="mt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                               {service.widgetType || 'generic'}
                            </span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between gap-2">
                       <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono truncate">
                          <Server size={12} className="shrink-0" />
                          <span className="truncate">{service.ip}</span>
                       </div>
                       
                       <div className="flex items-center gap-2 shrink-0 relative z-10">
                          <label className="text-[10px] text-slate-500 uppercase font-bold">{t('portLabel')}</label>
                          <input 
                            type="number" 
                            value={service.port}
                            onChange={(e) => updatePort(service.id, e.target.value)}
                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-right text-sm text-emerald-400 font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 shrink-0">
           <button 
             onClick={onClose} 
             className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
           >
             {t('btnCancel')}
           </button>
           <button 
             onClick={handleImport}
             disabled={selectedCount === 0}
             className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-colors"
           >
             <Globe size={18} />
             {t('btnAddCount', { count: selectedCount })}
           </button>
        </div>
      </div>
    </div>
  );
}