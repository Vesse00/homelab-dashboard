'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, Plus, X, LayoutGrid, HardDrive, CloudSun, Radar, Settings, Image as ImageIcon, Tablet, Smartphone, Check, MonitorSmartphone } from 'lucide-react';
import DashboardGrid from '@/app/[locale]/components/DashboardGrid';
import DockerWidget from '@/app/[locale]/components/widgets/DockerWidget';
import ContainerCard from '@/app/[locale]/components/ContainerCard';
import DiskWidget from '@/app/[locale]/components/widgets/DiskWidget';
import WeatherWidget from '@/app/[locale]/components/widgets/WeatherWidget';
import ServiceDiscoveryModal from '@/app/[locale]/components/ServiceDiscoveryModal';
import toast from 'react-hot-toast';
import ServiceWidget from '@/app/[locale]/components/widgets/ServiceWidget';
import ServerStatsWidget from '@/app/[locale]/components/widgets/ServerStatsWidget';
import { useLocale, useTranslations } from 'next-intl';
import WidgetGalleryModal from './components/WidgetGalleryModal';
import KioskWidgetGalleryModal from '@/app/[locale]/components/KioskWidgetGalleryModal';

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
    serviceId: string; // Unikalny identyfikator usługi
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
  isKiosk?: boolean; // Nowa właściwość, która może być używana do oznaczenia zakładek, które mają być ukrywane w trybie kiosk
  kioskWidth?: number;  // <--- DOKŁADNA SZEROKOŚĆ (PX)
  kioskHeight?: number; // <--- DOKŁADNA WYSOKOŚĆ (PX)
  widgets: WidgetItem[];
  parentId?: string; // ID nadrzędnej zakładki (dla hierarchii)
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
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

  // Stany związane z trybem kiosk i parowaniem nowych zakładek
  const [isNewTabKiosk, setIsNewTabKiosk] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [kioskTabIdToPair, setKioskTabIdToPair] = useState<string | null>(null);
  
  // Stan widgetów (pobieramy z localStorage lub domyślny)
  // Domyślna struktura zakładek dla nowego użytkownika
  const DEFAULT_TABS: TabData[] = [
    { id: 'main', name: t('defaultTabMain'), isDeletable: false, widgets: DEFAULT_LAYOUT }
  ];

  // Sprawdzenie, czy użytkownik jest adminem (na podstawie roli w sesji)
  const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN';

  const [tabs, setTabs] = useState<TabData[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('main');

  const activeTab = tabs.find(t => t.id === activeTabId);
  
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

  // Tworzy ID w stylu: widget-1709234023-xk29sla
  const generateUniqueId = () => {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Ładowanie danych startowych (układ, tło, dostępne usługi)
useEffect(() => {
    const loadInitialData = async () => {
      if (!session?.user) return;

      try {
        const layoutRes = await fetch('/api/user/layout');
        
        // ZABEZPIECZENIE: Sprawdzamy czy odpowiedź jest OK
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();

          // ZABEZPIECZENIE: Sprawdzamy czy layoutData.layout w ogóle istnieje
          if (layoutData && layoutData.layout) {
            
            // Przypadek 1: Stary format (płaska tablica widgetów) -> Konwertujemy na zakładki
            if (Array.isArray(layoutData.layout) && layoutData.layout.length > 0 && !layoutData.layout[0].widgets) {
              setTabs([
                { id: 'main', name: t('defaultTabMain'), isDeletable: false, widgets: layoutData.layout }
              ]);
            } 
            // Przypadek 2: Nowy format (tablica zakładek) -> Sprawdzamy czy pierwszy element istnieje
            else if (Array.isArray(layoutData.layout) && layoutData.layout.length > 0 && layoutData.layout[0].widgets) {
              setTabs(layoutData.layout);
            }
            // Przypadek 3: Pusta tablica lub dziwne dane -> Zostawiamy DEFAULT_TABS (które już są w stanie początkowym)
          }
        }

        const servicesRes = await fetch('/api/docker/scan');
        if (servicesRes.ok) {
           const servicesData = await servicesRes.json();
           if (servicesData.services) {
             setAvailableServices(servicesData.services);
           }
        }

      } catch (error) {
        console.error("Błąd podczas ładowania danych startowych:", error);
        // W razie błędu nic nie robimy - zostaje domyślny layout z useState
      }
    };

    loadInitialData();
  }, [session]);


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
    // Tworzymy widget na podstawie zapisanych danych
    const newWidget: WidgetItem = {
      i: generateUniqueId(),  //  Generujemy unikalne ID dla tego widgetu
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
    const newWidgets: WidgetItem[] = [];
    servicesData.forEach((data, index) => {

      const safeId = `widget-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
      newWidgets.push({
        i: safeId,
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
      toast.error(t('toastSaveError'));
    }
  };

// Zaktualizowana funkcja dodawania widgetu
  const addWidget = (type: string) => {
    const newWidget: WidgetItem = { 
      i: generateUniqueId(), // Generujemy unikalne ID dla tego widgetu
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

  // --- AKTUALIZACJA WYMIARÓW KIOSKU ---
  const handleUpdateKioskDimensions = (w: number, h: number) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, kioskWidth: w, kioskHeight: h } : tab
    );
    setTabs(updatedTabs); // Zmiana UI natychmiast
    
    // Zapis do bazy w tle
    fetch('/api/user/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: updatedTabs })
    }).catch(err => console.error("Błąd zapisu wymiarów", err));
  };


// --- DODAWANIE ZAKŁADKI ---
  const handleAddTab = () => {
    if (!newTabName.trim()) return;
    
    const newTabId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: newTabId,
      name: newTabName.trim(),
      isDeletable: true,
      isKiosk: isNewTabKiosk, // Ustawiamy flagę kiosk na podstawie stanu
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
    if(isNewTabKiosk) {
      setKioskTabIdToPair(newTabId);
      setIsPairingModalOpen(true);
    }

    setIsNewTabKiosk(false); // Resetujemy stan po dodaniu
  };

// --- USUWANIE ZAKŁADKI (Z CUSTOMOWYM, WYBLUROWANYM TOASTEM) ---
  const handleDeleteTab = (tabIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    // ZMIANA: Używamy toast.custom(), co daje nam 100% władzy nad wyglądem
    toast.custom((toastItem) => (
      <div 
        className={`
          ${toastItem.visible ? 'animate-enter opacity-100 scale-100' : 'animate-leave opacity-0 scale-95'}
          transition-all duration-300 ease-out pointer-events-auto
          max-w-sm w-full p-5 mt-4 rounded-2xl flex flex-col gap-3
          bg-slate-900/70 backdrop-blur-xl border border-red-500/40 
          shadow-[0_20px_40px_-10px_rgba(239,68,68,0.25)]
        `}
      >
        <span className="text-sm font-semibold text-white text-center">
          {t('deleteTabConfirm')}
        </span>
        
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => toast.dismiss(toastItem.id)}
            className="px-4 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700/50"
          >
            {t('btnCancel')}
          </button>
          <button
            onClick={() => {
              toast.dismiss(toastItem.id);
              
              const updatedTabs = tabs.filter(tab => tab.id !== tabIdToDelete && tab.parentId !== tabIdToDelete);
              setTabs(updatedTabs);
              
              if (activeTabId === tabIdToDelete) {
                setActiveTabId('main');
              }

              fetch('/api/user/layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ layout: updatedTabs })
              }).catch(err => console.error("Błąd zapisu po usunięciu zakładki", err));
              
              toast.success(t('toastTabDeleted'));
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

  // --- DODAWANIE NOWEJ STRONY DO ISTNIEJĄCEGO KIOSKU ---
  const handleAddSubTab = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Żeby kliknięcie w plusa nie przełączało zakładki
    
    const parentTab = tabs.find(t => t.id === parentId);
    if (!parentTab) return;

    // Liczymy, ile podstron już ma ten kiosk, żeby nadać ładną nazwę
    const subTabsCount = tabs.filter(t => t.parentId === parentId).length;
    
    const newTabId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: newTabId,
      name: `Strona ${subTabsCount + 2}`, // Skoro rodzic to str. 1, pierwsza podstrona to str. 2
      isDeletable: true,
      widgets: [],
      isKiosk: true, // Podstrona zawsze jest Kioskiem
      parentId: parentId, // Przypisanie do "Folderu"
      kioskWidth: parentTab.kioskWidth,   // ODZIEDZICZENIE WYMIARÓW!
      kioskHeight: parentTab.kioskHeight  // ODZIEDZICZENIE WYMIARÓW!
    };

    const updatedTabs = [...tabs, newTab];
    setTabs(updatedTabs);
    setActiveTabId(newTabId); // Od razu otwieramy nową stronę
    
    fetch('/api/user/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: updatedTabs })
    }).catch(err => console.error("Błąd zapisu podstrony", err));
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
               {isEditMode && isAdmin && (
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

                {/* Menu Dodawania */}
                {!activeTab?.isKiosk && (
                <WidgetGalleryModal 
                  isOpen={isGalleryOpen}
                  onClose={() => setIsGalleryOpen(false)}
                  isAdmin={isAdmin}
                  onAddWidget={addWidget}
                  onAddService={addServiceWidget}
                  onScan={handleScan} 
                  refreshTrigger={galleryRefreshKey}
                />
                )}

                {/* Galeria Widgetów dla Kiosku */}
                {activeTab?.isKiosk && (
                  <KioskWidgetGalleryModal 
                    isOpen={isGalleryOpen} 
                    onClose={() => setIsGalleryOpen(false)} 
                    onAddWidget={addWidget} // w Kiosku prawdopodobnie też używamy addWidget
                    onAddService={addServiceWidget}
                  />
                )}
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
        
        {/* GRUPA 1: ZWYKŁE PULPITY (PC) - bez zmian */}
        {tabs.filter(t => !t.isKiosk).map((tab) => {
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
              <div className="mr-2 flex items-center justify-center">
                {tab.id === 'main' 
                  ? <LayoutGrid size={15} className={isActive ? "text-sky-400" : "text-slate-500"} /> 
                  : <HardDrive size={15} className={isActive ? "text-sky-400" : "text-slate-500"} />
                }
              </div>
              <span>{tab.name}</span>
              
              {tab.isDeletable && (
                <div 
                  onClick={(e) => handleDeleteTab(tab.id, e)}
                  className={`overflow-hidden transition-all duration-300 ease-out flex items-center justify-center ${isActive ? 'w-5 opacity-100 ml-1.5' : 'w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-hover:ml-1.5'}`}
                >
                  <div className={`p-0.5 rounded-full transition-colors ${isActive ? 'text-sky-400/50 hover:text-red-400 hover:bg-red-500/20' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/20'}`}>
                    <X size={14} className="shrink-0" />
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* SEPARATOR (Jeśli są jakieś kioski) */}
        {tabs.some(t => t.isKiosk) && (
          <div className="w-px h-6 bg-slate-700/50 mx-2 shrink-0 rounded-full" />
        )}

        {/* GRUPA 2: EKRANY KIOSK (Telefony/Tablety Z PODSTRONAMI) */}
        {tabs.filter(t => t.isKiosk && !t.parentId).map((mainTab) => {
          const isMainActive = mainTab.id === activeTabId;
          const subTabs = tabs.filter(t => t.parentId === mainTab.id); // Szukamy podstron tego kiosku

          return (
            // WSPÓLNE TŁO DLA CAŁEGO "URZĄDZENIA"
            <div key={mainTab.id} className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-full border border-slate-700/50 shadow-sm">
              
              {/* GŁÓWNA STRONA KIOSKU */}
              <button
                onClick={() => setActiveTabId(mainTab.id)}
                className={`
                  group relative flex items-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap
                  ${isMainActive 
                    ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
                  }
                `}
              >
                <div className="mr-2 flex items-center justify-center">
                  <MonitorSmartphone size={15} className={isMainActive ? "text-purple-400" : "text-slate-500 group-hover:text-purple-400"} />
                </div>
                <span>{mainTab.name}</span>
                
                {/* MENU HOVER (PLUSIK I KRZYŻYK) */}
                <div className="overflow-hidden transition-all duration-300 ease-out flex items-center justify-center w-0 opacity-0 group-hover:w-12 group-hover:opacity-100 group-hover:ml-2">
                  <div 
                    onClick={(e) => handleAddSubTab(mainTab.id, e)}
                    className="p-1 rounded-full text-emerald-400 hover:bg-emerald-500/20 mr-1 transition-colors"
                    title="Dodaj nową stronę"
                  >
                    <Plus size={14} className="shrink-0" />
                  </div>
                  {mainTab.isDeletable && (
                    <div 
                      onClick={(e) => handleDeleteTab(mainTab.id, e)}
                      className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <X size={14} className="shrink-0" />
                    </div>
                  )}
                </div>
              </button>

              {/* PODSTRONY KIOSKU (Renderowane obok rodzica wewnątrz tej samej ramki) */}
              {subTabs.length > 0 && <div className="w-px h-4 bg-slate-700/50 mx-1 shrink-0" />}
              {subTabs.map(subTab => {
                 const isSubActive = subTab.id === activeTabId;
                 return (
                   <button
                      key={subTab.id}
                      onClick={() => setActiveTabId(subTab.id)}
                      className={`
                        group relative flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                        ${isSubActive
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-sm'
                          : 'text-slate-500 hover:text-purple-300 hover:bg-slate-800 border border-transparent'
                        }
                      `}
                   >
                      <span>{subTab.name}</span>
                      
                      {/* USUWANIE PODSTRONY */}
                      <div className="overflow-hidden transition-all duration-300 ease-out flex items-center justify-center w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-hover:ml-1.5">
                        <div
                          onClick={(e) => handleDeleteTab(subTab.id, e)}
                          className="p-0.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <X size={12} className="shrink-0" />
                        </div>
                      </div>
                   </button>
                 )
              })}
            </div>
          );
        })}

        {/* Przycisk "+" dodający główną zakładkę */}
        <button
          onClick={() => setIsAddTabModalOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-white hover:border-slate-500/50 transition-all shrink-0 shadow-sm ml-1"
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
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
              
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">{t('newTabTitle')}</h3>
              <p className="text-sm text-slate-400 mb-5 relative z-10">Utwórz nową pustą przestrzeń na widgety.</p>
              
              <input
                type="text"
                autoFocus
                placeholder="Np. Kamery, Serwery..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all mb-4 relative z-10"
              />

              {/* CHECKBOX KIOSKU */}
              <label className="flex items-center gap-3 p-3 mb-6 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-800/50 transition-colors relative z-10 group">
                <div className={`flex items-center justify-center w-5 h-5 rounded border ${isNewTabKiosk ? 'bg-purple-500 border-purple-500' : 'bg-slate-900 border-slate-600 group-hover:border-purple-500/50'}`}>
                  {isNewTabKiosk && <Check size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isNewTabKiosk} 
                  onChange={(e) => setIsNewTabKiosk(e.target.checked)} 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Przeznacz na tablet (Kiosk Mode)</span>
                  <span className="text-xs text-slate-500">Otworzy asystenta parowania ekranu</span>
                </div>
              </label>
              
              <div className="flex justify-end gap-3 relative z-10">
                <button 
                  onClick={() => setIsAddTabModalOpen(false)} 
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  {t('btnCancel')}
                </button>
                <button 
                  onClick={handleAddTab} 
                  className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${
                    isNewTabKiosk ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30' : 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/30'
                  }`}
                >
                  {isNewTabKiosk ? 'Dalej' : t('btnCreate')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NOWY: MODAL PAROWANIA KIOSKU --- */}
      <AnimatePresence>
        {isPairingModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
            >
              {/* Tło Modala */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-purple-500/20 to-transparent blur-2xl -z-10" />

              <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <Smartphone size={32} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Połącz z ekranem</h3>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                Otwórz panel na swoim tablecie, wybierz <strong>Skonfiguruj jako Kiosk</strong> i wpisz wyświetlony tam 8-cyfrowy kod autoryzacji.
              </p>

              {/* Input Kodu - Stylizowany na duże cyfry */}
              <input
                type="text"
                maxLength={9} // "1234-5678" z myślnikiem
                placeholder="0000-0000"
                value={pairingCode}
                onChange={(e) => {
                  // Proste formatowanie kodu XXXX-XXXX w locie
                  let val = e.target.value.replace(/\D/g, ''); 
                  if (val.length > 4) val = val.slice(0,4) + '-' + val.slice(4,8);
                  setPairingCode(val);
                }}
                className="w-48 bg-slate-950/50 border-2 border-purple-500/50 rounded-2xl px-4 py-4 text-center text-3xl font-mono font-bold text-white placeholder-slate-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all mb-8 tracking-widest uppercase"
              />

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsPairingModalOpen(false)} 
                  className="flex-1 py-3 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Pomiń na razie
                </button>
                <button 
                  onClick={async () => {
                    const toastId = toast.loading('Łączenie urządzenia...');
                    try {
                      const res = await fetch('/api/kiosk/pair', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          pairingCode: pairingCode,
                          tabId: kioskTabIdToPair 
                        })
                      });

                      const data = await res.json();
                      
                      if (res.ok) {
                        toast.success(data.message || 'Pomyślnie połączono urządzenie!', { id: toastId });
                        setIsPairingModalOpen(false);
                        setPairingCode(''); 
                      } else {
                        toast.error(data.error || 'Błąd parowania. Sprawdź kod.', { id: toastId });
                      }
                    } catch (error) {
                      toast.error('Błąd połączenia z serwerem.', { id: toastId });
                    }
                  }} 
                  disabled={pairingCode.length !== 9}
                  className="flex-1 py-3 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Połącz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- RENDEROWANIE GRIDA (PC vs KIOSK) --- */}
      {activeTab?.isKiosk ? (
        <div className="flex flex-col items-center justify-center py-4 md:py-8 w-full">
          
          {/* INFO O WYMIARACH ZSYNCHRONIZOWANYCH Z URZĄDZENIEM */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 shadow-xl">
             <div className="flex items-center gap-2 text-purple-400">
               <MonitorSmartphone size={18} />
               <span className="text-sm font-bold tracking-widest uppercase">Ekran Docelowy:</span>
             </div>

             <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800 shadow-inner">
                <span className="text-emerald-400 font-mono text-sm font-bold">
                  {activeTab.kioskWidth || 1280} x {activeTab.kioskHeight || 800} px
                </span>
             </div>

             {(!activeTab.kioskWidth || !activeTab.kioskHeight) && (
               <span className="text-xs text-amber-500 font-medium ml-2 animate-pulse flex items-center gap-2">
                 Uruchom urządzenie, aby zsynchronizować wymiary...
               </span>
             )}
          </div>
          
          {/* DYNAMICZNA RAMKA KIOSKU (Automatycznie używa pikseli z bazy) */}
          <div className="w-full bg-[#050505] border-[16px] border-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar relative transition-all duration-500"
               style={{ 
                 // 1. CSS automatycznie wylicza idealne proporcje okna na podstawie pikseli!
                 aspectRatio: `${activeTab.kioskWidth || 1280} / ${activeTab.kioskHeight || 800}`,
                 // 2. Nie pozwalamy, by np. wymiar 2560px rozsadził monitor PC. Zachowa proporcje, ale zwęzi się do max 1400px.
                 maxWidth: `${Math.min(activeTab.kioskWidth || 1280, 1400)}px` 
               }}
          >
            {/* Odbicie światła na "szybie" tabletu */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none z-50"></div>
            
            <DashboardGrid 
              layout={activeWidgets} 
              onLayoutChange={(newLayout) => saveLayout(newLayout)}
              isAdmin={isAdmin}
              onToggleLock={toggleWidgetLock}
              isEditMode={isEditMode}
              onRemove={removeWidget}
              onUpdateData={updateWidgetData}
              highlightedId={highlightedId}
              isKiosk={true}
            />
          </div>
        </div>
      ) : (
        /* STANDARDOWY WIDOK PC (Na całą szerokość) */
        <DashboardGrid 
          layout={activeWidgets} 
          onLayoutChange={(newLayout) => saveLayout(newLayout)}
          isAdmin={isAdmin}
          onToggleLock={toggleWidgetLock}
          isEditMode={isEditMode}
          onRemove={removeWidget}
          onUpdateData={updateWidgetData}
          highlightedId={highlightedId}
          isKiosk={false}
        />
      )}

      {/* MODAL  */}
       <ServiceDiscoveryModal 
          isOpen={isDiscoveryOpen} 
          onClose={() => setIsDiscoveryOpen(false)}
          onSaveToDb={() => {
           // Po zapisaniu do bazy opcjonalnie możemy otworzyć galerię, żeby użytkownik dodał widgety
           setIsGalleryOpen(true);
        }}
          initialServices={scannedServices}
       />

    </div>
  );
}