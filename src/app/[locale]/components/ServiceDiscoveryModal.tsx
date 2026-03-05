'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Radar, Check, Server, Globe, Box, CheckSquare, Square } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

interface DiscoveredService {
  id: string;
  name: string;
  icon: string;
  protocol: 'http' | 'https';
  ip: string;
  port: number;
  color: string;
  selected: boolean;
  widgetType?: string;
  containerId?: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  slate: 'bg-slate-500/10 border-slate-500/20 text-slate-500',
  red: 'bg-red-500/10 border-red-500/20 text-red-500',
  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
};

// ============================================================================
// OPTYMALIZACJA: Wyodrębnienie wiersza. Wpisanie portu przeładuje TYLKO TEN element.
// ============================================================================
const ServiceItem = React.memo(({ service, updateField, toggleSelect, t }: any) => {
  // @ts-ignore
  const Icon = LucideIcons[service.icon] || Box;
  const colorStyle = COLOR_MAP[service.color] || COLOR_MAP.slate;

  return (
    <div 
      style={{ contentVisibility: 'auto' }}
      className={`bg-slate-800/60 border rounded-2xl p-4 flex flex-col gap-3 relative transition-all duration-300 ease-out will-change-transform ${
        service.selected ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 ${colorStyle}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate text-sm tracking-tight">{service.name}</h3>
            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                {service.widgetType || 'generic'}
            </span>
          </div>
          <button 
            onClick={() => toggleSelect(service.id)} 
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors duration-200 ${
              service.selected ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-slate-600 bg-slate-900 hover:border-slate-400'
            }`}
          >
            {service.selected && <Check size={14} className="text-white" />}
          </button>
      </div>

      <div className="grid grid-cols-12 gap-2 mt-1">
          <div className="col-span-3">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 ml-1">Proto</label>
            <select 
              value={service.protocol}
              onChange={(e) => updateField(service.id, 'protocol', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white px-1 py-2 focus:border-blue-500 outline-none transition-colors duration-200 cursor-pointer"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div className="col-span-6">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 ml-1">IP / Host</label>
            <input 
              type="text" 
              value={service.ip}
              onChange={(e) => updateField(service.id, 'ip', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white px-2 py-2 focus:border-blue-500 outline-none font-mono transition-colors duration-200"
            />
          </div>
          <div className="col-span-3">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 ml-1">{t('portLabel')}</label>
            <input 
              type="number" 
              value={service.port}
              onChange={(e) => updateField(service.id, 'port', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-emerald-400 font-bold px-1 py-2 focus:border-blue-500 outline-none font-mono text-center transition-colors duration-200"
            />
          </div>
      </div>
    </div>
  );
});
ServiceItem.displayName = 'ServiceItem';

// ============================================================================

export default function ServiceDiscoveryModal({ isOpen, onClose, onSaveToDb, initialServices }: any) {
  const [services, setServices] = useState<DiscoveredService[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const t = useTranslations('ServiceDiscovery');

  useEffect(() => {
    if (!isOpen) { setHasLoaded(false); setServices([]); }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialServices.length > 0 && !hasLoaded) {
      const mapped = initialServices.map((s: any, idx: number) => {
        let ip = 'localhost';
        let port = 80;
        let protocol: 'http' | 'https' = 'http';
        try {
          if (s.url && s.url.startsWith('https')) protocol = 'https';
          const urlObj = new URL(s.url);
          ip = urlObj.hostname;
          port = parseInt(urlObj.port) || 80;
        } catch (e) {}

        return { id: `scan-${idx}-${Date.now()}`, name: s.name, icon: s.icon, protocol, ip, port, color: s.color, selected: true, widgetType: s.widgetType, containerId: s.containerId };
      });
      setServices(mapped);
      setHasLoaded(true);
    }
  }, [isOpen, initialServices, hasLoaded]);

  // Używamy useCallback, żeby nie tworzyć nowych referencji funkcji przy każdym przerysowaniu listy
  const updateField = useCallback((id: string, field: keyof DiscoveredService, value: any) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  }, []);

  const handleSave = async () => {
    const selectedServices = services.filter(s => s.selected);
    const toastId = toast.loading(t('toastSaving'));
    try {
      const res = await fetch('/api/services/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selectedServices) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(t('toastSaved'), { id: toastId });
      onSaveToDb();
      onClose();
    } catch (e) {
      toast.error(t('toastError'), { id: toastId });
    }
  };

  const allSelected = services.length > 0 && services.every(s => s.selected);
  const toggleAll = () => setServices(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  if (!isOpen) return null;
  const selectedCount = services.filter(s => s.selected).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 transition-opacity duration-300">
      <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 ease-out">
        
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight"><Radar className="text-purple-400" /> {t('title')}</h2>
            <p className="text-slate-400 text-sm mt-1">{t('subtitle', { count: services.length })}</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleAll} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors duration-200 text-xs font-bold border border-slate-700 hover:border-slate-600">
               {allSelected ? <CheckSquare size={14} className="text-blue-400"/> : <Square size={14} />} {allSelected ? t('deselectAll') : t('selectAll')}
             </button>
             <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map((service) => (
               <ServiceItem 
                 key={service.id} 
                 service={service} 
                 updateField={updateField} 
                 toggleSelect={toggleSelect} 
                 t={t} 
               />
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800/50 bg-slate-900 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors duration-200">
             {t('btnCancel')}
           </button>
           <button onClick={handleSave} disabled={selectedCount === 0} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center gap-2 transition-transform duration-200 active:scale-95 will-change-transform">
             <Globe size={18} /> {t('btnSave', { count: selectedCount })}
           </button>
        </div>
      </div>
    </div>
  );
}