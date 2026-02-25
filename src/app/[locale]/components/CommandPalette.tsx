'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Box, LayoutGrid, Settings, ShieldAlert, Eye, TerminalSquare, ExternalLink } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  icon: any;
  category: string;
  url?: string;        // Do akcji "Przejdź"
  highlightId?: string; // Do akcji "Podświetl"
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [containers, setContainers] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('CommandPalette');
  const inputRef = useRef<HTMLInputElement>(null);

  // Nasłuchiwanie na Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Event z przycisku
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Pobieranie danych
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);

      fetch('/api/containers')
        .then(res => res.json())
        .then(data => setContainers(data || []))
        .catch(err => console.error(err));

      fetch('/api/user/layout')
        .then(res => res.json())
        .then(data => setWidgets(data.layout || []))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  // BUDOWANIE UNIKALNEJ LISTY
  const buildItems = (): CommandItem[] => {
    const items: CommandItem[] = [
      { id: 'page-dashboard', title: t('pageDashboard'), icon: LayoutGrid, url: `/${locale}`, category: t('pages') },
      { id: 'page-containers', title: t('pageContainers'), icon: Box, url: `/${locale}/containers`, category: t('pages') },
      { id: 'page-settings', title: t('pageSettings'), icon: Settings, url: `/${locale}/user/settings`, category: t('pages') },
      { id: 'page-admin', title: t('pageAdmin'), icon: ShieldAlert, url: `/${locale}/user/admin`, category: t('pages') },
    ];

    const appMap = new Map<string, CommandItem>();

    // 1. Dodajemy KONTENERY (Tylko te z prawidłowymi nazwami)
    containers.forEach(c => {
      const name = c.Names?.[0]?.replace('/', '');
      if (!name || name.toLowerCase() === 'unknown') return; // Filtrujemy nieznane!
      
      appMap.set(name.toLowerCase(), {
        id: `app-${c.Id}`,
        title: name,
        icon: TerminalSquare,
        category: t('containers'),
        url: `/${locale}/containers/${c.Id}` // Link do szczegółów kontenera
      });
    });

    // 2. Dodajemy WIDGETY (lub doklejamy highlight, jeśli taki kontener już istnieje w mapie)
    widgets.forEach(w => {
      let title = w.type;
      if (w.type === 'docker_stats') title = 'Docker Stats';
      if (w.type === 'disk_stats') title = 'Disk Stats';
      if (w.type === 'server_stats') title = 'Server Stats';
      if (w.type === 'weather') title = 'Weather';
      if (w.type === 'service' && w.data) title = w.data.name;

      if (!title || title === 'unknown') return;

      const key = title.toLowerCase();
      if (appMap.has(key)) {
        // Mamy już taki kontener! Doklejamy mu ID do podświetlenia na pulpicie
        const existing = appMap.get(key)!;
        existing.highlightId = w.i;
      } else {
        // Nie ma takiego kontenera (to tylko widget)
        appMap.set(key, {
          id: `widget-${w.i}`,
          title: title,
          icon: LayoutGrid,
          category: t('widgets'),
          highlightId: w.i,
          url: w.type === 'service' && w.data?.url ? w.data.url : undefined
        });
      }
    });

    items.push(...Array.from(appMap.values()));
    return items;
  };

  const allResults = buildItems();
  const filteredResults = query 
    ? allResults.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    : allResults;

  // OBSŁUGA AKCJI
  const handleAction = (item: CommandItem, forceType?: 'go' | 'highlight') => {
    setIsOpen(false);
    
    // Jeśli wymuszono 'go' i mamy URL (lub to jest domyślna akcja gdy nie wymuszono a url istnieje)
    if ((forceType === 'go' && item.url) || (!forceType && item.url)) {
      router.push(item.url);
      return;
    }
    
    // Jeśli wymuszono 'highlight' lub fallback
    if (item.highlightId) {
      router.push(`/${locale}?highlight=${item.highlightId}`);
    }
  };

  // Poruszanie się strzałkami i Enter
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
      if (e.key === 'Enter' && filteredResults.length > 0) {
        e.preventDefault();
        const item = filteredResults[selectedIndex];
        // Shift+Enter wymusza podświetlenie, sam Enter wymusza Przejdź
        if (e.shiftKey) handleAction(item, 'highlight');
        else handleAction(item, 'go');
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, filteredResults, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/50">
          <Search className="text-blue-500 mr-3 shrink-0" size={24} />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none py-5 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-0"
            placeholder={t('placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="text-xs text-slate-500 border border-slate-700 rounded px-2 py-1 shrink-0 bg-slate-800">ESC</div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 bg-slate-900/50">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {t('empty', { query })}
            </div>
          ) : (
             filteredResults.map((item, index) => {
               const Icon = item.icon;
               const isSelected = index === selectedIndex;

               return (
                 <div
                   key={item.id}
                   onMouseEnter={() => setSelectedIndex(index)}
                   className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl transition-all ${
                     isSelected ? 'bg-blue-600/10 border border-blue-500/30' : 'border border-transparent hover:bg-slate-800/50'
                   }`}
                 >
                   <div className="flex items-center gap-3 overflow-hidden mb-2 sm:mb-0 cursor-pointer" onClick={() => handleAction(item)}>
                     <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                       <Icon size={18} />
                     </div>
                     <div className="flex flex-col">
                       <span className={`font-semibold truncate ${isSelected ? 'text-blue-100' : 'text-slate-300'}`}>
                         {item.title}
                       </span>
                       <span className="text-[10px] uppercase font-bold text-slate-500">
                         {item.category}
                       </span>
                     </div>
                   </div>

                   {/* Widoczne Przyciski Akcji */}
                   {isSelected && (
                     <div className="flex items-center gap-2 pl-4 sm:pl-0 shrink-0">
                       {item.url && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleAction(item, 'go'); }}
                           className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                         >
                           <ExternalLink size={14} /> {t('actionGo')} 
                           <div className="hidden sm:flex items-center gap-0.5 ml-1 opacity-70">
                             <span className="bg-blue-500/20 border border-blue-500/30 rounded px-1 text-[9px] tracking-wider">ENTER</span>
                           </div>
                         </button>
                       )}
                       {item.highlightId && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleAction(item, 'highlight'); }}
                           className="flex items-center gap-1.5 text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                         >
                           <Eye size={14} /> {t('actionHighlight')} 
                           <div className="hidden sm:flex items-center gap-0.5 ml-1 opacity-70">
                             <span className="bg-purple-500/20 border border-purple-500/30 rounded px-1 text-[9px] tracking-wider">SHIFT</span>
                             <span className="bg-purple-500/20 border border-purple-500/30 rounded px-1 text-[9px] tracking-wider">ENTER</span>
                           </div>
                         </button>
                       )}
                     </div>
                   )}
                 </div>
               );
             })
          )}
        </div>
      </div>
    </div>
  );
}