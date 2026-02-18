'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, Plus, X, LayoutGrid } from 'lucide-react';
import DashboardGrid from '@/components/DashboardGrid';
import DockerWidget from '@/components/widgets/DockerWidget';
import ContainerCard from '@/components/ContainerCard';

// Definicja dostępnych typów widgetów
const WIDGET_TYPES = {
  DOCKER_STATS: 'docker_stats',
  CONTAINER_LIST: 'container_list', // Np. lista kontenerów jako widget
};

// Domyślny layout startowy
const DEFAULT_LAYOUT = [
  { i: '1', x: 0, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DOCKER_STATS },
  { i: '2', x: 4, y: 0, w: 4, h: 2, type: WIDGET_TYPES.DOCKER_STATS },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  // Stan widgetów (pobieramy z localStorage lub domyślny)
  const [widgets, setWidgets] = useState(DEFAULT_LAYOUT);

  // Zapisywanie layoutu do localStorage (prymitywne persistence)
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_layout');
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);

  const saveLayout = (newLayout: any[]) => {
    // Scalamy nowy layout (pozycje x,y,w,h) z naszymi danymi o typie widgetu
    const updatedWidgets = newLayout.map(l => {
      const existing = widgets.find(w => w.i === l.i);
      return { ...l, type: existing?.type || WIDGET_TYPES.DOCKER_STATS };
    });
    setWidgets(updatedWidgets);
    localStorage.setItem('dashboard_layout', JSON.stringify(updatedWidgets));
  };

  const addWidget = (type: string) => {
    const newId = (Math.max(...widgets.map(w => parseInt(w.i))) + 1).toString();
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
    localStorage.setItem('dashboard_layout', JSON.stringify(newWidgets));
    setIsAddMenuOpen(false);
  };

  const removeWidget = (id: string) => {
    const filtered = widgets.filter(w => w.i !== id);
    setWidgets(filtered);
    localStorage.setItem('dashboard_layout', JSON.stringify(filtered));
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
                isEditMode={isEditMode}
                onRemove={() => removeWidget(widget.i)}
                title={`Kontener #${widget.i}`} // Tutaj docelowo nazwa kontenera
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

    </div>
  );
}