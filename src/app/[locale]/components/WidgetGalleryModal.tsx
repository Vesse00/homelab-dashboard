'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, LayoutGrid, HardDrive, CloudSun, Server, Wifi, PlaySquare, Radar, Box, Plus, Pencil, Activity, Cloud, ShieldCheck, Gamepad2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';
import ServiceEditModal from './ServiceEditModal';
import { KNOWN_APPS } from '@/app/lib/appMap';

// WSPÓLNY INTERFEJS DLA WSZYSTKICH ELEMENTÓW W GALERII
// Dzięki temu TypeScript przestanie krzyczeć o brakujące pola
interface WidgetItem {
  id: string;
  name: string;
  desc: string;
  icon: any;
  category: string;
  color: string;
  isService: boolean;
  data?: any;      // Opcjonalne (tylko dla usług)
  rawData?: any;   // Opcjonalne (tylko dla usług)
}

const THEME_STYLES: Record<string, { container: string, iconBox: string, icon: string }> = {
  blue: {
    container: 'hover:border-blue-500/50 hover:bg-blue-900/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    iconBox: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
    icon: 'text-blue-400 group-hover:text-white'
  },
  purple: {
    container: 'hover:border-purple-500/50 hover:bg-purple-900/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    iconBox: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
    icon: 'text-purple-400 group-hover:text-white'
  },
  emerald: {
    container: 'hover:border-emerald-500/50 hover:bg-emerald-900/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    iconBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
    icon: 'text-emerald-400 group-hover:text-white'
  },
  yellow: {
    container: 'hover:border-yellow-500/50 hover:bg-yellow-900/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]',
    iconBox: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white',
    icon: 'text-yellow-400 group-hover:text-white'
  },
  amber: {
    container: 'hover:border-amber-500/50 hover:bg-amber-900/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
    icon: 'text-amber-400 group-hover:text-white'
  },
  cyan: {
    container: 'hover:border-cyan-500/50 hover:bg-cyan-900/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    iconBox: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white',
    icon: 'text-cyan-400 group-hover:text-white'
  },
  red: {
    container: 'hover:border-red-500/50 hover:bg-red-900/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    iconBox: 'bg-red-500/10 border-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white',
    icon: 'text-red-400 group-hover:text-white'
  },
  slate: {
    container: 'hover:border-slate-500/50 hover:bg-slate-800/30 hover:shadow-[0_0_20px_rgba(100,116,139,0.1)]',
    iconBox: 'bg-slate-500/10 border-slate-500/20 text-slate-400 group-hover:bg-slate-500 group-hover:text-white',
    icon: 'text-slate-400 group-hover:text-white'
  },
};

export default function WidgetGalleryModal({ 
  isOpen, onClose, onAddWidget, onAddService, onScan, refreshTrigger 
}: any) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any>(null);
  
  const t = useTranslations('WidgetGallery');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services/inventory');
      if (res.ok) {
        const data = await res.json();
        setDbServices(data);
      }
    } catch (e) { console.error("Błąd pobierania usług:", e); }
  };

  // ODŚWIEŻANIE: Tylko przy otwarciu LUB gdy zmieni się refreshTrigger (np. po skanowaniu)
  useEffect(() => {
    if (isOpen) fetchServices();
  }, [isOpen, refreshTrigger]);

  // OPTYMALIZACJA: Kategorie tworzone raz (useMemo)
  const CATEGORIES = useMemo(() => [
    { id: 'all', label: t('categories.all'), icon: LayoutGrid },
    { id: 'system', label: t('categories.system'), icon: Server },
    { id: 'network', label: t('categories.network'), icon: Wifi },
    { id: 'monitoring', label: t('categories.monitoring'), icon: Activity },
    { id: 'media', label: t('categories.media'), icon: PlaySquare },
    { id: 'cloud', label: t('categories.cloud'), icon: Cloud },
    { id: 'security', label: t('categories.security'), icon: ShieldCheck },
    { id: 'games', label: t('categories.games'), icon: Gamepad2 },
    { id: 'apps', label: t('categories.apps'), icon: Box },
  ], [t]);

  // OPTYMALIZACJA: Lista widgetów przeliczana tylko gdy zmienią się dane w bazie
  const allWidgets = useMemo<WidgetItem[]>(() => {
    const core: WidgetItem[] = [
      { id: 'docker_stats', name: t('widgets.docker_stats.name'), desc: t('widgets.docker_stats.desc'), icon: Box, category: 'system', color: 'blue', isService: false },
      { id: 'disk_stats', name: t('widgets.disk_stats.name'), desc: t('widgets.disk_stats.desc'), icon: HardDrive, category: 'system', color: 'purple', isService: false },
      { id: 'server_stats', name: t('widgets.server_stats.name'), desc: t('widgets.server_stats.desc'), icon: Server, category: 'system', color: 'emerald', isService: false },
      { id: 'weather', name: t('widgets.weather.name'), desc: t('widgets.weather.desc'), icon: CloudSun, category: 'media', color: 'yellow', isService: false },
    ];

    const services: WidgetItem[] = dbServices.map((s: any) => {
      const getAppDefinition = (widgetType: string) => {
        return Object.values(KNOWN_APPS).find(app => app.widgetType === widgetType);
      };
      
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
    });

    return [...core, ...services];
  }, [dbServices, t]); 

  // OPTYMALIZACJA: Filtrowanie kategorii
  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      if (cat.id === 'all') return true;
      return allWidgets.some(widget => widget.category === cat.id);
    });
  }, [CATEGORIES, allWidgets]);

  // OPTYMALIZACJA: Filtrowanie wyszukiwania
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter(w => {
      const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allWidgets, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 transition-all duration-300">
        <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex overflow-hidden mt-16 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          
          {/* SIDEBAR */}
          <div className="w-64 bg-slate-950/40 border-r border-slate-800/50 hidden md:flex flex-col">
            <div className="p-6 border-b border-slate-800/50">
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
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-800/50">
               <button 
                  onClick={onScan}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl transition-all hover:scale-[1.02] text-sm font-bold shadow-lg shadow-purple-900/10"
                >
                  <Radar size={16} />
                  {t('btnScan')}
               </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-gradient-to-br from-slate-900/50 to-slate-950/50">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between gap-4">
               <div className="relative w-full max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
               </div>
               <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
                 <X size={20} />
               </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
               {filteredWidgets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                     <Box size={48} className="mb-4 opacity-30" />
                     <p className="text-lg font-medium">{t('noWidgetsFound')}</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max pb-10">
                     {filteredWidgets.map((widget, idx) => {
                       const Icon = widget.icon;
                       const theme = THEME_STYLES[widget.color] || THEME_STYLES.slate;

                       return (
                          <div 
                            key={widget.id || idx} 
                            className={`group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 ${theme.container}`}
                          >
                             <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-lg ${theme.iconBox}`}>
                                   <Icon size={24} className={`transition-transform duration-300 group-hover:scale-110 ${theme.icon}`} />
                                </div>

                                <div className="flex items-center gap-2 h-7">
                                  
                                  {/* Sprawdzamy bezpiecznie czy widget ma flagę isService */}
                                  {widget.isService && (
                                    <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         if (widget.rawData) setEditingService(widget.rawData);
                                      }}
                                      className="hidden group-hover:flex items-center justify-center w-7 h-7 bg-slate-950/80 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all animate-in fade-in slide-in-from-right-2 shadow-md border border-slate-700/50 hover:border-blue-500"
                                      title="Edytuj"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}

                                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800 whitespace-nowrap flex items-center h-full">
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
                                 if (widget.isService && widget.data) {
                                    onAddService(widget.data);
                                 } else {
                                    onAddWidget(widget.id);
                                 }
                                 onClose(); 
                               }}
                               className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-slate-900/50 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/50 hover:border-blue-500/50 shadow-md hover:shadow-blue-900/20 active:scale-95`}
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