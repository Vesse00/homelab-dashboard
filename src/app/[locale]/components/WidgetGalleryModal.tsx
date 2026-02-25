'use client';

import { useState } from 'react';
import { 
  X, Search, LayoutGrid, HardDrive, CloudSun, 
  Server, Wifi, PlaySquare, Radar, Box, Plus 
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-600',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-600',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600',
  yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-600',
  slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400 group-hover:bg-slate-600',
};

export default function WidgetGalleryModal({ 
  isOpen, onClose, onAddWidget, onAddService, availableServices, onScan 
}: any) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const t = useTranslations('WidgetGallery');

  if (!isOpen) return null;

  // Przeniesione do środka, by użyć tłumaczeń
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

  const allWidgets = [
    ...CORE_WIDGETS,
    ...availableServices.map((s: any) => {
      // @ts-ignore
      const Icon = LucideIcons[s.icon] || Box;
      return {
        isService: true,
        data: s,
        id: s.name,
        name: s.name,
        desc: s.url || t('defaultServiceDesc'),
        icon: Icon,
        category: 'apps',
        color: s.color || 'blue'
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex overflow-hidden mt-16">
        
        <div className="w-64 bg-slate-950/50 border-r border-slate-800 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl transition-colors text-sm font-bold"
              >
                <Radar size={16} />
                {t('btnScan')}
             </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
             <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
             </div>
             <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
               <X size={20} />
             </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20">
             {filteredWidgets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                   <Box size={48} className="mb-4 opacity-50" />
                   <p className="text-lg">{t('noWidgetsFound')}</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                   {filteredWidgets.map((widget, idx) => {
                     const Icon = widget.icon;
                     const colorStyle = COLOR_MAP[widget.color] || COLOR_MAP.slate;

                     return (
                        <div key={idx} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col transition-all group hover:shadow-xl hover:shadow-black/50">
                           <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${colorStyle}`}>
                                 <Icon size={24} className="group-hover:text-white transition-colors" />
                              </div>
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                                {widget.category}
                              </span>
                           </div>
                           
                           <h3 className="text-white font-bold text-lg mb-1">{widget.name}</h3>
                           <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-6">
                              {widget.desc}
                           </p>

                           <button 
                             onClick={() => {
                               if (widget.isService) onAddService(widget.data);
                               else onAddWidget(widget.id);
                               onClose(); 
                             }}
                             className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800`}
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
  );
}