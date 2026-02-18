'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, Plus, X, LayoutGrid, HardDrive, CloudSun, Radar } from 'lucide-react';
import DashboardGrid from '@/components/DashboardGrid';
import DockerWidget from '@/components/widgets/DockerWidget';
import ContainerCard from '@/components/ContainerCard';
import DiskWidget from '@/components/widgets/DiskWidget';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import ServiceDiscoveryModal from '@/components/ServiceDiscoveryModal';
import { toast } from 'react-hot-toast';

// Definicja dostępnych typów widgetów
const WIDGET_TYPES = {
  DOCKER_STATS: 'docker_stats',
  DISK_STATS: 'disk_stats', 
  WEATHER: 'weather',
  SERVICE: 'service', // Nowy typ dla usług z autodekrypcji
};

interface WidgetItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  // Pole opcjonalne, tylko dla widgetów typu 'service'
  data?: {
    name: string;
    icon: string;
    url: string;
    color: string;
    status: string;
  };
}

// Domyślny layout startowy
const DEFAULT_LAYOUT = [
  { i: '1', x: 0, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DOCKER_STATS },
  { i: '2', x: 4, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DOCKER_STATS },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  
  // Stan widgetów (pobieramy z localStorage lub domyślny)
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [scannedServices, setScannedServices] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  // Zapisywanie layoutu do localStorage (prymitywne persistence)
  useEffect(() => {
    const fetchLayout = async () => {
      if (session?.user) {
        try {
          const res = await fetch('/api/user/layout');
          const data = await res.json();
          if (data.layout) {
            setWidgets(data.layout);
          } else {
            // Jeśli użytkownik jest nowy i nie ma layoutu w bazie, użyj domyślnego
            setWidgets(DEFAULT_LAYOUT);
          }
        } catch (e) {
          console.error("Błąd pobierania layoutu", e);
        }

        try {
         const res = await fetch('/api/docker/scan'); // Metoda GET pobiera z bazy
         const data = await res.json();
         if (data.services) setAvailableServices(data.services);
      } catch(e) { console.error(e); }
      }
    };
    fetchLayout();
  }, [session]); // Uruchom, gdy sesja się załaduje

const handleScan = async () => {
    const toastId = toast.loading("Skanowanie Dockera...");
    try {
      const res = await fetch('/api/docker/scan', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
         // A. Aktualizujemy listę w menu "Dodaj" (persistence)
         setAvailableServices(data.services);
         
         // B. Otwieramy Modal z tymi wynikami, żeby użytkownik mógł edytować porty
         setScannedServices(data.services);
         setIsDiscoveryOpen(true);
         
         toast.success(`Znaleziono ${data.count} usług!`, { id: toastId });
      } else {
         throw new Error(data.error);
      }
    } catch (e) {
      toast.error("Błąd skanowania", { id: toastId });
    }
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
        data: data // Tu są dane z portem zmienionym w Modalu
      });
    });

    setWidgets(newWidgets);
    saveLayout(newWidgets);
    toast.success(`Dodano ${servicesData.length} widgetów`);
  };

  const saveLayout = async (newLayout: any[]) => {
    // Aktualizuj stan lokalny (żeby UI działało płynnie)
    const updatedWidgets = newLayout.map(l => {
      const existing = widgets.find(w => w.i === l.i);
      return { ...l, type: existing?.type || WIDGET_TYPES.DOCKER_STATS };
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
      type: type
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

  return (
    <div className="min-h-screen p-6 relative">
      
      {/* Nagłówek Dashboardu z kontrolkami */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Witaj, {session?.user?.name || 'Gościu'}. Twoje centrum dowodzenia.
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
                   <span className="hidden md:inline">Wykryj</span>
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
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Plus size={18} />
                  <span>Dodaj</span>
                </button>

                {/* Dropdown Menu Dodawania */}
                {isAddMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2">
                      <p className="text-xs font-bold text-slate-500 uppercase px-3 py-2">Dostępne widgety</p>
                      <button 
                        onClick={() => addWidget(WIDGET_TYPES.DOCKER_STATS)}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LayoutGrid size={16} className="text-blue-400"/>
                        Docker Stats
                      </button>
                      <button 
                        onClick={() => addWidget(WIDGET_TYPES.DISK_STATS)}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <HardDrive size={16} className="text-purple-400"/>
                        Status Dysków
                      </button>

                      <button 
                        onClick={() => addWidget(WIDGET_TYPES.WEATHER)}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <CloudSun size={16} className="text-yellow-400"/>
                        Pogoda
                      </button>
                      {/* Tu dodasz kolejne typy widgetów */}
                    </div>
                  </div>
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
            <span>{isEditMode ? 'Zapisz układ' : 'Edytuj'}</span>
          </button>
        </div>
      </div>

      {/* Grid z Widgetami */}
      <DashboardGrid 
        layout={widgets} 
        onLayoutChange={saveLayout}
        isEditMode={isEditMode}
      >
        {widgets.map((widget) => (
          <div key={widget.i} className={isEditMode ? "z-10" : "z-0"}>
            {/* Renderowanie warunkowe na podstawie typu widgetu */}
            {widget.type === WIDGET_TYPES.DOCKER_STATS && (
              <DockerWidget 
                id={widget.i}
                isEditMode={isEditMode}
                onRemove={() => removeWidget(widget.i)}
                title='Docker'
                className='h-full w-full'
              />
            )}
            {widget.type === WIDGET_TYPES.DISK_STATS && (
              <DiskWidget 
                id={widget.i}
                isEditMode={isEditMode}
                onRemove={() => removeWidget(widget.i)}
                className='h-full w-full'
              />
            )}
            {widget.type === WIDGET_TYPES.WEATHER && (
              <WeatherWidget 
                id={widget.i}
                isEditMode={isEditMode}
                onRemove={() => removeWidget(widget.i)}
                className='h-full w-full'
              />
            )}
            
            {/* Jeśli typ jest nieznany */}
            {widget.type === 'unknown' && (
               <div className="w-full h-full bg-red-500/20 border border-red-500 rounded-xl flex items-center justify-center text-red-500">
                 Błąd widgetu
               </div>
            )}
          </div>
        ))}
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