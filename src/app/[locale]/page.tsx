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
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [scannedServices, setScannedServices] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightParam = searchParams.get('highlight');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  

  
  const [greeting, setGreeting] = useState(t('goodMorning'));
  const [bgUrl, setBgUrl] = useState('');
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [tempBgUrl, setTempBgUrl] = useState('');

  // Zapisywanie i Pobieranie Layoutu z API
useEffect(() => {
    const fetchData = async () => {
      if (session?.user) {
        try {
          // 1. Pobierz Layout Dashboardu
          const layoutRes = await fetch('/api/user/layout');
          const layoutData = await layoutRes.json();
          if (layoutData.layout) {
            setWidgets(layoutData.layout);
          } else {
            setWidgets(DEFAULT_LAYOUT);
          }

          // 2. Pobierz Zapisane Usługi (To jest to, czego brakowało!)
          const servicesRes = await fetch('/api/docker/scan');
          const servicesData = await servicesRes.json();
          if (servicesData.services) {
            setAvailableServices(servicesData.services);
          }

          const hour = new Date().getHours();
          if (hour >= 5 && hour < 18) setGreeting(t('goodMorning'));
          else setGreeting(t('goodEvening'));

          const savedBg = localStorage.getItem('dashboardBg');
          if (savedBg) {
            setBgUrl(savedBg);
            setTempBgUrl(savedBg);
          }

        } catch (e) {
          console.error("Błąd pobierania danych", e);
        }
      }
    };
    fetchData();
  }, [session]); // Uruchom, gdy sesja się załaduje

// EFEKT PODŚWIETLANIA:
  useEffect(() => {
    if (highlightParam && widgets.length > 0) {
      // 1. Aktywujemy podświetlenie w React
      setHighlightedId(highlightParam);
      
      // 2. Dajemy siatce chwilę i zjeżdżamy ekranem
      const scrollTimer = setTimeout(() => {
        document.getElementById(`widget-${highlightParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);

      // 3. Po 2.5 sekundach wyłączamy podświetlenie i czyścimy URL
      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
        router.replace(`/${locale}`, { scroll: false });
      }, 2500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  // Usunięto 'router' i 'locale' z tablicy zależności, aby rozwiązać błąd ESLint!
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightParam, widgets]);

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
    const newId = widgets.length > 0 ? (Math.max(...widgets.map(w => parseInt(w.i))) + 1).toString() : "1";
    
    // Tworzymy widget na podstawie zapisanych danych
    const newWidget: WidgetItem = {
      i: newId,
      x: 0, 
      y: Infinity, // Grid sam znajdzie miejsce na dole
      w: 2,
      h: 2,
      type: WIDGET_TYPES.SERVICE,
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

    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    
    // Zapisz layout
    await saveLayout(newWidgets); // Używamy Twojej funkcji saveLayout
    
    setIsAddMenuOpen(false);
    toast.success(t('toastAddedService', { name: serviceData.name }));
  };


  // 2. IMPORTOWANIE Z MODALA (dodaje widgety na pulpit)
  const handleImportServices = (servicesData: any[]) => {
    const newWidgets: WidgetItem[] = [...widgets];
    let lastId = widgets.length > 0 ? Math.max(...widgets.map(w => parseInt(w.i))) : 0;

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

    setWidgets(newWidgets);
    saveLayout(newWidgets);
    toast.success(t('toastAddedWidgets', { count: servicesData.length }));
  };

  const saveLayout = async (newLayout: any[]) => {
    // Aktualizuj stan lokalny (żeby UI działało płynnie)
    const updatedWidgets = newLayout.map(l => {
      const existing = widgets.find(w => w.i === l.i);
      
      return { 
        ...l, 
        // 1. Przywracamy poprawny typ
        type: l.type || existing?.type || WIDGET_TYPES.DOCKER_STATS,
        // 2. Przywracamy dane, których Grid nas pozbawił!
        data: l.data || existing?.data 
      };
    });
    setWidgets(updatedWidgets);

    // Wyślij do bazy (w tle)
    if (session?.user) {
      try {
        await fetch('/api/user/layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: updatedWidgets }),
        });
      } catch (e) {
        console.error("Błąd zapisu layoutu", e);
      }
    }
  };

  const addWidget = async (type: string) => {
    const newId = widgets.length > 0 ? (Math.max(...widgets.map(w => parseInt(w.i))) + 1).toString() : "1";
    const newWidget = {
      i: newId,
      x: 0,
      y: Infinity, // Doda na samym dole
      w: 4,
      h: 2,
      type: type,
      static: false,
    };
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    if (session?.user) {
        await fetch('/api/user/layout', {
          method: 'POST',
          body: JSON.stringify({ layout: newWidgets }),
        });
    }
    setIsAddMenuOpen(false);
  };

  const removeWidget = async (id: string) => {
    const filtered = widgets.filter(w => w.i !== id);
    setWidgets(filtered);
    // Zapisz do bazy
    if (session?.user) {
        await fetch('/api/user/layout', {
          method: 'POST',
          body: JSON.stringify({ layout: filtered }),
        });
    }
  };

  // Aktualizuje dane (w tym ustawienia i hasła) wewnątrz widgetu
  const updateWidgetData = (id: string, newData: any) => {
    const updatedWidgets = widgets.map(w => {
      if (w.i === id) {
         // Nadpisujemy stare 'data' nowymi danymi (które zawierają nasze settings)
        return { ...w, data: newData };
      }
      return w;
    });
    
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets); // Zapisujemy od razu do bazy!
    toast.success(t('toastSettingsSaved'));
  };

  // --- Przełączanie Kłódki ---
  const toggleWidgetLock = (id: string) => {
    const updatedWidgets = widgets.map(w => {
      if (w.i === id) {
        const isNowLocked = !w.static;
        if (isNowLocked) toast.success(t('toastLockToggled'));
        return { ...w, static: isNowLocked };
      }
      return w;
    });
    
    setWidgets(updatedWidgets);
    saveLayout(updatedWidgets); // Od razu zapisujemy układ do bazy!
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

      {/* Grid z Widgetami */}
      <DashboardGrid 
        layout={widgets} 
        onLayoutChange={(newLayout) => {
             // Tutaj Twoja logika zapisywania (saveLayout lub setWidgets)
             setWidgets(newLayout);
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