'use client';

import { useState, useEffect } from 'react';
import { X, Search, LayoutGrid, HardDrive, CloudSun, Server, Wifi, PlaySquare, Radar, Box, Plus, Pencil } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import ServiceEditModal from './ServiceEditModal';
import { KNOWN_APPS } from '@/app/lib/appMap';

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
  yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white',
  red: 'bg-red-500/10 border-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white',
  slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400 group-hover:bg-slate-500 group-hover:text-white',
};

export default function WidgetGalleryModal({ 
  isOpen, onClose, onAddWidget, onAddService, onScan 
}: any) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any>(null);
  
  const t = useTranslations('WidgetGallery');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services/inventory');
      if (res.ok) setDbServices(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isOpen) fetchServices();
  }, [isOpen]);

  if (!isOpen) return null;

  const CATEGORIES = [
    { id: 'all', label: t('categories.all'), icon: LayoutGrid },
    { id: 'system', label: t('categories.system'), icon: Server },
    { id: 'network', label: t('categories.network'), icon: Wifi },
    { id: 'media', label: t('categories.media'), icon: PlaySquare },
    { id: 'apps', label: t('categories.apps'), icon: Box },
  ];

  const CORE_WIDGETS = [
    { id: 'docker_stats', name: t('widgets.docker_stats.name'), desc: t('widgets.docker_stats.desc'), icon: Box, category: 'system', color: 'blue' },
    { id: 'disk_stats', name: t('widgets.disk_stats.name'), desc: t('widgets.disk_stats.desc'), icon: HardDrive, category: 'system', color: 'purple' },
    { id: 'server_stats', name: t('widgets.server_stats.name'), desc: t('widgets.server_stats.desc'), icon: Server, category: 'system', color: 'emerald' },
    { id: 'weather', name: t('widgets.weather.name'), desc: t('widgets.weather.desc'), icon: CloudSun, category: 'media', color: 'yellow' },
  ];

  const getAppDefinition = (widgetType: string) => {
    return Object.values(KNOWN_APPS).find(app => app.widgetType === widgetType);
  };

  const allWidgets = [
    ...CORE_WIDGETS,
    ...dbServices.map((s: any) => {
      const knownApp = getAppDefinition(s.type);
      const finalColor = knownApp?.color || 'blue';
      const finalCategory = knownApp?.category || 'apps';
      
      // @ts-ignore
      const Icon = LucideIcons[s.icon] || Box;

      return {
        isService: true,
        data: {
          name: s.name,
          icon: s.icon,
          url: `${s.protocol}://${s.ip}:${s.port}`,
          publicUrl: s.publicUrl, 
          color: finalColor,
          status: 'running',
          widgetType: s.type,
          settings: { 
             authType: s.authType,
             apiKey: s.apiKey,
             username: s.username,
             password: s.password
          }
        },
        rawData: s, 
        id: s.name,
        name: s.name,
        desc: s.publicUrl || `${s.ip}:${s.port}`, 
        icon: Icon,
        category: finalCategory,
        color: finalColor
      };
    })
  ];

  const visibleCategories = CATEGORIES.filter(cat => {
    if (cat.id === 'all') return true;
    return allWidgets.some(widget => widget.category === cat.id);
  });

  const filteredWidgets = allWidgets.filter(w => {
    const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex overflow-hidden mt-16 animate-in fade-in zoom-in-95 duration-200">
          
          {/* SIDEBAR */}
          <div className="w-64 bg-slate-950/50 border-r border-slate-800 hidden md:flex flex-col">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <LayoutGrid className="text-blue-400" /> {t('title')}
              </h2>
            </div>
            <div className="p-4 flex-1 space-y-1">
              {visibleCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                      isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-800">
               <button 
                  onClick={onScan}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl transition-all hover:scale-[1.02] text-sm font-bold shadow-lg shadow-purple-900/10"
                >
                  <Radar size={16} />
                  {t('btnScan')}
               </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
               <div className="relative w-full max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
               </div>
               <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
                 <X size={20} />
               </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-950/20">
               {filteredWidgets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                     <Box size={48} className="mb-4 opacity-50" />
                     <p className="text-lg font-medium">{t('noWidgetsFound')}</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max pb-10">
                     {filteredWidgets.map((widget, idx) => {
                       const Icon = widget.icon;
                       const colorStyle = COLOR_MAP[widget.color] || COLOR_MAP.slate;

                       return (
                          <div 
                            key={idx} 
                            className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
                          >
                             {/* GÓRNA BELKA (Ikona + Ołówek + Tag) */}
                             <div className="flex items-start justify-between mb-4">
                                {/* Ikona */}
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-lg ${colorStyle}`}>
                                   <Icon size={24} className="transition-transform duration-300 group-hover:scale-110" />
                                </div>

                                {/* Kontener dla Ołówka i Taga (W jednej linii!) */}
                                <div className="flex items-center gap-2">
                                  
                                  {/* IKONKA EDYCJI (OŁÓWEK) */}
                                  {/* hidden -> flex przy hover. Powoduje przesunięcie taga. */}
                                  {widget.isService && (
                                    <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setEditingService(widget.rawData);
                                      }}
                                      className="hidden group-hover:flex items-center justify-center w-7 h-7 bg-slate-950 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 shadow-md animate-in fade-in slide-in-from-right-2"
                                      title="Edytuj"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}

                                  {/* TAG KATEGORII */}
                                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 whitespace-nowrap">
                                    {widget.category}
                                  </span>
                                </div>
                             </div>
                             
                             <h3 className="text-white font-bold text-lg mb-1 truncate pr-2 tracking-tight group-hover:text-blue-100 transition-colors">
                               {widget.name}
                             </h3>
                             <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-6 truncate font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                                {widget.desc}
                             </p>

                             <button 
                               onClick={() => {
                                 if (widget.isService) onAddService(widget.data);
                                 else onAddWidget(widget.id);
                                 onClose(); 
                               }}
                               className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shadow-md active:scale-95`}
                             >
                               <Plus size={16} /> {t('btnAdd')}
                             </button>
                          </div>
                       )
                     })}
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {editingService && (
        <ServiceEditModal 
          service={editingService}
          onClose={() => setEditingService(null)}
          onUpdate={fetchServices}
        />
      )}
    </>
  );
}