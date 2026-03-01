'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, Plus, X, LayoutGrid, HardDrive, CloudSun, Radar, Settings, Image as ImageIcon } from 'lucide-react';
import DashboardGrid from '@/app/[locale]/components/DashboardGrid';
import DockerWidget from '@/app/[locale]/components/widgets/DockerWidget';
import ContainerCard from '@/app/[locale]/components/ContainerCard';
import DiskWidget from '@/app/[locale]/components/widgets/DiskWidget';
import WeatherWidget from '@/app/[locale]/components/widgets/WeatherWidget';
import ServiceDiscoveryModal from '@/app/[locale]/components/ServiceDiscoveryModal';
import { toast } from 'react-hot-toast';
import ServiceWidget from '@/app/[locale]/components/widgets/ServiceWidget';
import ServerStatsWidget from '@/app/[locale]/components/widgets/ServerStatsWidget';
import { useLocale, useTranslations } from 'next-intl';
import WidgetGalleryModal from './components/WidgetGalleryModal';

// Definicja dostępnych typów widgetów
const WIDGET_TYPES = {
  DOCKER_STATS: 'docker_stats',
  DISK_STATS: 'disk_stats', 
  WEATHER: 'weather',
  SERVER_STATS: 'server_stats',
  SERVICE: 'service', // Nowy typ dla usług z autodekrypcji
};

interface WidgetItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  static?: boolean;
  // Pole opcjonalne, tylko dla widgetów typu 'service'
  data?: {
    name: string;
    icon: string;
    url: string;
    color: string;
    status: string;
    settings?: any; // Tu możemy później przechowywać ustawienia (np. porty, auth) dla tego widgetu
  };
  
}

// Struktura danych dla zakładek
interface TabData {
  id: string;
  name: string;
  isDeletable: boolean;
  widgets: WidgetItem[];
}

// Domyślny layout startowy
const DEFAULT_LAYOUT = [
  { i: '1', x: 0, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DOCKER_STATS },
  { i: '2', x: 4, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DISK_STATS },
  { i: '3', x: 0, y: 2, w: 4, h: 2, type: WIDGET_TYPES.SERVER_STATS },
];

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Admin'; // Fallback na nazwę użytkownika
  
  // Stan widgetów (pobieramy z localStorage lub domyślny)
  // Domyślna struktura zakładek dla nowego użytkownika
  const DEFAULT_TABS: TabData[] = [
    { id: 'main', name: 'Główny', isDeletable: false, widgets: DEFAULT_LAYOUT }
  ];

  const [tabs, setTabs] = useState<TabData[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('main');
  
  // Pomocnicza zmienna, żeby kod poniżej (z gridem) wiedział, jakie widgety ma wyświetlić
  const activeWidgets = tabs.find(t => t.id === activeTabId)?.widgets || [];
  const [scannedServices, setScannedServices] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightParam = searchParams.get('highlight');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  
  const [greeting, setGreeting] = useState(t('goodMorning'));
  const [bgUrl, setBgUrl] = useState('');
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [tempBgUrl, setTempBgUrl] = useState('');

  // Zapisywanie i Pobieranie Layoutu z API
// 1. Ładowanie danych startowych (Layout + Usługi)
  useEffect(() => {
    const loadInitialData = async () => {
      // Wykonujemy tylko, jeśli mamy sesję
      if (!session?.user) return;

      try {
        // --- A. POBIERANIE UKŁADU (Z MIGRACJĄ ZAKŁADEK) ---
        const layoutRes = await fetch('/api/user/layout');
        const layoutData = await layoutRes.json();

        if (layoutData.layout) {
          // Sprawdzamy czy to stary format (bez 'widgets'), czy nowy (z zakładkami)
          if (Array.isArray(layoutData.layout) && layoutData.layout.length > 0 && !layoutData.layout[0].widgets) {
            setTabs([
              { id: 'main', name: 'Główny', isDeletable: false, widgets: layoutData.layout }
            ]);
          } else if (Array.isArray(layoutData.layout) && layoutData.layout[0].widgets) {
            setTabs(layoutData.layout);
          }
        }

        // --- B. POBIERANIE ZAPISANYCH USŁUG ---
        const servicesRes = await fetch('/api/docker/scan');
        const servicesData = await servicesRes.json();
        
        if (servicesData.services) {
          setAvailableServices(servicesData.services);
        }

      } catch (error) {
        console.error("Błąd podczas ładowania danych startowych:", error);
      }
    };

    loadInitialData();
  }, [session]); // Uruchom, gdy sesja się załaduje

// --- EFEKT PODŚWIETLANIA (Z AUTOMATYCZNĄ ZMIANĄ ZAKŁADKI) ---
  useEffect(() => {
    if (highlightParam && tabs.length > 0) {
      // 1. Szukamy, na której zakładce fizycznie znajduje się ten widget
      const tabWithWidget = tabs.find(tab => 
        tab.widgets.some(w => w.i === highlightParam)
      );

      // 2. Jeśli widget jest na innej zakładce niż obecna -> PRZEŁĄCZAMY!
      if (tabWithWidget && tabWithWidget.id !== activeTabId) {
        setActiveTabId(tabWithWidget.id);
      }

      // 3. Odpalamy podświetlenie
      setHighlightedId(highlightParam);
      
      // Dajemy Reactowi ułamek sekundy na wyrenderowanie nowej zakładki (jeśli była zmiana)
      const scrollTimer = setTimeout(() => {
        document.getElementById(`widget-${highlightParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Lekko wydłużony czas na animację zmiany kart

      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
        router.replace(`/${locale}`, { scroll: false });
      }, 2500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  // Ważne: Zmieniamy w zależnościach activeWidgets na tabs, bo musimy przeszukać całość
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightParam, tabs]);

  const saveBackground = () => {
  setBgUrl(tempBgUrl);
  localStorage.setItem('dashboardBg', tempBgUrl);
  setIsBgModalOpen(false);
};

const handleScan = async () => {
    const toastId = toast.loading(t('toastScanning'));
    try {
      const res = await fetch('/api/docker/scan', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
         // A. Aktualizujemy listę w menu "Dodaj" (persistence)
         setAvailableServices(data.services);
         
         // B. Otwieramy Modal z tymi wynikami, żeby użytkownik mógł edytować porty
         setScannedServices(data.services);
         setIsDiscoveryOpen(true);
         
         toast.success(t('toastScanSuccess', { count: data.count }), { id: toastId });
      } else {
         throw new Error(data.error);
      }
    } catch (e) {
      toast.error(t('toastScanError'), { id: toastId });
    }
  };


  const addServiceWidget = async (serviceData: any) => {
    // Zbieramy wszystkie widgety z całej aplikacji (ze wszystkich zakładek)
    const allWidgets = tabs.flatMap(t => t.widgets || []);
    
    // Szukamy najwyższego ID globalnie
    const newId = allWidgets.length > 0 
      ? (Math.max(0, ...allWidgets.map(w => parseInt(w.i) || 0)) + 1).toString() 
      : "1";
    
    // Tworzymy widget na podstawie zapisanych danych
    const newWidget: WidgetItem = {
      i: newId,
      x: 0, 
      y: Infinity, // Grid sam znajdzie miejsce na dole
      w: 2,
      h: 2,
      type: serviceData.widgetType || WIDGET_TYPES.SERVICE,
      static: false,
      data: {
        ...serviceData,
      settings: {
          authType: 'none',
          apiKey: '',
          username: '',
          password: ''
        }
      }, // Przekazujemy gotowe dane (nazwa, ikona, url)
    };

    const newLayout = [...activeWidgets, newWidget];
    saveLayout(newLayout);
  };


  // 2. IMPORTOWANIE Z MODALA (dodaje widgety na pulpit)
  const handleImportServices = (servicesData: any[]) => {
    const newWidgets: WidgetItem[] = [...activeWidgets];
    // ZMIANA: Pobieramy absolutnie wszystkie widgety ze wszystkich zakładek
    const allWidgets = tabs.flatMap(t => t.widgets || []);
    
    // ZMIANA: Szukamy najwyższego ID globalnie (zabezpieczone przez || 0 w razie NaN)
    let lastId = allWidgets.length > 0 
      ? Math.max(0, ...allWidgets.map(w => parseInt(w.i) || 0)) 
      : 0;

    servicesData.forEach((data) => {
      lastId++;
      newWidgets.push({
        i: lastId.toString(),
        x: (newWidgets.length * 2) % 12,
        y: Infinity,
        w: 2,
        h: 2,
        type: WIDGET_TYPES.SERVICE,
        static: false,
        data: {
          ...data,
          settings: {
            authType: 'none',
            apiKey: '',
            username: '',
            password: ''
          }
        } // Tu są dane z portem zmienionym w Modalu
      });
    });

    const newLayout = [...activeWidgets, ...newWidgets];
    saveLayout(newLayout);
    toast.success(t('toastAddedWidgets', { count: servicesData.length }));
  };

  // 2. Zapisywanie układu (teraz zapisujemy całe `tabs`)
  const saveLayout = async (newLayoutForActiveTab: any[]) => {
    // A. Przywracamy nasze unikalne dane (type, data, static), które Grid mógł usunąć z obiektów
    const updatedWidgets = newLayoutForActiveTab.map(l => {
      const existing = activeWidgets.find(w => w.i === l.i);
      return { 
        ...l, 
        type: l.type || existing?.type || WIDGET_TYPES.DOCKER_STATS,
        data: l.data || existing?.data 
      };
    });

    // B. Tworzymy nową tablicę zakładek, podmieniając widgety TYLKO w aktywnej zakładce
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, widgets: updatedWidgets } 
        : tab
    );

    // C. Aktualizujemy stan UI, żeby nie mrygało
    setTabs(updatedTabs);

    // D. Wysyłamy do API CAŁĄ konfigurację zakładek
    try {
      const res = await fetch('/api/user/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: updatedTabs })
      });
      if (!res.ok) throw new Error("Błąd zapisu");
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się zapisać układu zakładek.');
    }
  };

// Zaktualizowana funkcja dodawania widgetu
  const addWidget = (type: string) => {
    // Zbieramy wszystkie widgety z całej aplikacji (ze wszystkich zakładek)
    const allWidgets = tabs.flatMap(t => t.widgets || []);
    
    // Szukamy najwyższego ID globalnie
    const newId = allWidgets.length > 0 
      ? (Math.max(0, ...allWidgets.map(w => parseInt(w.i) || 0)) + 1).toString() 
      : "1";
    const newWidget: WidgetItem = { 
      i: newId, 
      x: 0, y: 0, w: 4, h: 2, 
      type: type 
    };
    
    // Dodajemy na początek aktywnej zakładki
    const newLayout = [newWidget, ...activeWidgets];
    saveLayout(newLayout);
  };

// --- USUWANIE WIDGETU ---
  const removeWidget = (id: string) => {
    const newLayout = activeWidgets.filter(w => w.i !== id);
    saveLayout(newLayout); // <--- Zapisuje do bazy
  };

// --- AKTUALIZACJA DANYCH WIDGETU (np. z modalu edycji) ---
  const updateWidgetData = (id: string, newData: any) => {
    const newLayout = activeWidgets.map(w => 
      w.i === id ? { ...w, data: newData } : w
    );
    saveLayout(newLayout); // <--- Zapisuje do bazy
  };

// --- BLOKOWANIE/ODBLOKOWANIE WIDGETU ---
  const toggleWidgetLock = (id: string) => {
    const newLayout = activeWidgets.map(w => 
      w.i === id ? { ...w, static: !w.static } : w
    );
    saveLayout(newLayout); // <--- Zapisuje do bazy
  };


// --- DODAWANIE ZAKŁADKI ---
  const handleAddTab = () => {
    if (!newTabName.trim()) return;
    
    const newTabId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: newTabId,
      name: newTabName.trim(),
      isDeletable: true,
      widgets: [] // Nowa zakładka jest pusta na start
    };

    const updatedTabs = [...tabs, newTab];
    setTabs(updatedTabs);
    setActiveTabId(newTabId); // Od razu na nią przechodzimy
    
    fetch('/api/user/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: updatedTabs })
    }).catch(err => console.error("Błąd zapisu nowej zakładki", err));

    setNewTabName('');
    setIsAddTabModalOpen(false);
  };

// --- USUWANIE ZAKŁADKI (Z CUSTOMOWYM, WYBLUROWANYM TOASTEM) ---
  const handleDeleteTab = (tabIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    // ZMIANA: Używamy toast.custom(), co daje nam 100% władzy nad wyglądem
    toast.custom((t) => (
      <div 
        className={`
          ${t.visible ? 'animate-enter opacity-100 scale-100' : 'animate-leave opacity-0 scale-95'}
          transition-all duration-300 ease-out pointer-events-auto
          max-w-sm w-full p-5 mt-4 rounded-2xl flex flex-col gap-3
          bg-slate-900/70 backdrop-blur-xl border border-red-500/40 
          shadow-[0_20px_40px_-10px_rgba(239,68,68,0.25)]
        `}
      >
        <span className="text-sm font-semibold text-white text-center">
          Czy na pewno chcesz usunąć tę zakładkę i wszystkie jej widgety?
        </span>
        
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700/50"
          >
            Anuluj
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              
              const updatedTabs = tabs.filter(tab => tab.id !== tabIdToDelete);
              setTabs(updatedTabs);
              
              if (activeTabId === tabIdToDelete) {
                setActiveTabId('main');
              }

              fetch('/api/user/layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ layout: updatedTabs })
              }).catch(err => console.error("Błąd zapisu po usunięciu zakładki", err));
              
              toast.success('Zakładka usunięta');
            }}
            className="px-5 py-2 text-xs font-bold bg-red-600/80 hover:bg-red-500 text-white rounded-xl transition-all border border-red-500/50 shadow-lg shadow-red-900/30 active:scale-95"
          >
            Usuń
          </button>
        </div>
      </div>
    ), { 
      duration: 8000, 
      id: `delete-tab-${tabIdToDelete}`, 
      position: 'top-center'
      // Zniknął obiekt "style", wszystko robimy Tailwindem!
    });
  };

  return (
    <div className="min-h-screen p-6 relative">
      
      {/* Nagłówek Dashboardu z kontrolkami */}
      <div className="flex items-center justify-between mb-8">
        <div >
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t('title')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('greeting', { name: userName })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* PRZYCISK AUTODETEKCJI (Widoczny w trybie edycji) */}
             <AnimatePresence>
               {isEditMode && (
                 <motion.button
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   onClick={handleScan}
                   className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
                 >
                   <Radar size={18} />
                   <span className="hidden md:inline">{t('btnDetect')}</span>
                 </motion.button>
               )}
             </AnimatePresence>
          {/* Przycisk DODAJ WIDGET (widoczny w trybie edycji) */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                <button
                  onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Plus size={18} />
                  <span>{t('btnAdd')}</span>
                </button>

                {/* Dropdown Menu Dodawania */}
                <WidgetGalleryModal 
                  isOpen={isGalleryOpen}
                  onClose={() => setIsGalleryOpen(false)}
                  onAddWidget={addWidget}
                  onAddService={addServiceWidget}
                  availableServices={availableServices}
                  onScan={handleScan}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Przycisk TRYB EDYCJI */}
          <button
            onClick={() => {
                setIsEditMode(!isEditMode);
                setIsAddMenuOpen(false); // Zamknij menu jeśli otwarte
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isEditMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isEditMode ? <Save size={18} /> : <Edit2 size={18} />}
            <span>{isEditMode ? t('btnSaveLayout') : t('btnEdit')}</span>
          </button>
        </div>
      </div>

      {/* --- SUB-NAVBAR (ZAKŁADKI W STYLU "PILLS" Z ANIMOWANYM X) --- */}
      <div className="sticky top-[72px] z-40 mb-6 flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`
                group relative flex items-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border
                ${isActive 
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600'
                }
              `}
            >
              {/* Ikona z odstępem (margin-right) */}
              <div className="mr-2 flex items-center justify-center">
                {tab.id === 'main' 
                  ? <LayoutGrid size={15} className={isActive ? "text-sky-400" : "text-slate-500"} /> 
                  : <HardDrive size={15} className={isActive ? "text-sky-400" : "text-slate-500"} />
                }
              </div>
              
              <span>{tab.name}</span>
              
              {/* ANIMOWANY PRZYCISK "X" (Płynnie rozwija szerokość) */}
              {tab.isDeletable && (
                <div 
                  onClick={(e) => handleDeleteTab(tab.id, e)}
                  className={`
                    overflow-hidden transition-all duration-300 ease-out flex items-center justify-center
                    ${isActive 
                      ? 'w-5 opacity-100 ml-1.5' // Zawsze rozwinięty dla aktywnej
                      : 'w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-hover:ml-1.5' // Zwinięty do 0px, rozwija się na hover
                    }
                  `}
                >
                  <div className={`p-0.5 rounded-full transition-colors ${isActive ? 'text-sky-400/50 hover:text-red-400 hover:bg-red-500/20' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/20'}`}>
                    <X size={14} className="shrink-0" />
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Przycisk "+" dodający nową zakładkę */}
        <button
          onClick={() => setIsAddTabModalOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-sky-400 hover:border-sky-500/30 transition-all shrink-0 shadow-sm ml-1"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* --- MODAL DO NAZYWANIA NOWEJ ZAKŁADKI --- */}
      <AnimatePresence>
        {isAddTabModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Dekoracyjne tło */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
              
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Nowa przestrzeń</h3>
              <p className="text-sm text-slate-400 mb-6 relative z-10">Wpisz nazwę dla swojej nowej zakładki z widgetami.</p>
              
              <input
                type="text"
                autoFocus
                placeholder="Np. Multimedia, Serwery..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all mb-6 relative z-10"
              />
              
              <div className="flex justify-end gap-3 relative z-10">
                <button 
                  onClick={() => setIsAddTabModalOpen(false)} 
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  onClick={handleAddTab} 
                  className="px-6 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all active:scale-95"
                >
                  Utwórz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid z Widgetami */}
      <DashboardGrid 
        layout={activeWidgets} 
        onLayoutChange={(newLayout) => {
            // Funkcja saveLayout zaktualizuje stan zakładek i od razu wyśle to do bazy
             saveLayout(newLayout);
          }}
        onToggleLock={toggleWidgetLock}
        isEditMode={isEditMode}
        onRemove={removeWidget}
        onUpdateData={updateWidgetData}
        highlightedId={highlightedId}
      >
        
      </DashboardGrid>

      {/* MODAL  */}
       <ServiceDiscoveryModal 
          isOpen={isDiscoveryOpen} 
          onClose={() => setIsDiscoveryOpen(false)}
          onImport={handleImportServices}
          initialServices={scannedServices}
       />

    </div>
  );
}