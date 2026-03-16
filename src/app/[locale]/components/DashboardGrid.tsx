'use client';

import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { renderKioskWidget } from './kiosk-widgets/KioskWidgetRenderer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// IMPORTUJEMY WSZYSTKIE TWOJE WIDGETY
// (Bez tego Grid nie wie co wyświetlić i robi puste/brzydkie divy)
import ServiceWidget from './widgets/ServiceWidget';
import DockerWidget from './widgets/DockerWidget';
import DiskWidget from './widgets/DiskWidget';
import WeatherWidget from './widgets/WeatherWidget';
import ServerStatsWidget from './widgets/ServerStatsWidget';


const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  layout: any[];
  onLayoutChange: (layout: any[]) => void;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onUpdateData?: (id: string, newData: any) => void;
  isAdmin?: boolean; // Dodajemy opcjonalny prop isAdmin
  onToggleLock: (id: string) => void;
  highlightedId?: string | null; // Dodajemy opcjonalny prop dla highlight
  isKiosk?: boolean; // Czy ten grid jest częścią Kiosku (domyślnie false)
}

export default function DashboardGrid({ 
  layout, 
  onLayoutChange, 
  isEditMode, 
  onRemove,
  onUpdateData,
  onToggleLock,
  highlightedId,
  isAdmin,
  isKiosk,
}: DashboardGridProps) {

  const seenIds = new Set();
  const safeLayout = layout.filter(item => {
    if (seenIds.has(item.i)) {
      console.warn(`[DashboardGrid] Wykryto i usunięto duplikat widgetu o ID: ${item.i}`);
      return false;
    }
    seenIds.add(item.i);
    return true;
  });

  // Funkcja, która wybiera odpowiedni komponent widgetu
  const renderWidget = (item: any) => {
    // Wspólne właściwości przekazywane do każdego widgetu
    const commonProps = {
      id: item.i,
      isEditMode: isEditMode,
      onRemove: onRemove,
      className: "h-full w-full", // To naprawia rozjeżdżanie się (zajmuje 100% kafelka)
      data: item.data,
      isAdmin: isAdmin, // Przekazujemy informację o adminie do widgetu
      onUpdateData: onUpdateData,
      w: item.w,
      h: item.h,
      isLocked: item.static, // <--- PRZEKAZUJEMY STAN KŁÓDKI (wbudowane w item)
      onToggleLock: onToggleLock
    };

    const kioskElement = renderKioskWidget(item, commonProps);
    if (kioskElement) {
      return kioskElement; // Jeśli tak, przerywamy i renderujemy od razu ten piękny kafelek!
    }

    switch (item.type) {
      // Łączymy wszystkie typy "usługowe" w jeden case, aby obsłużył je ServiceWidget
      case 'service':
      case 'pihole':
      case 'adguard':
      case 'minecraft':
      case 'media':
      case 'home-assistant':
      case 'uptime-kuma':
      case 'tailscale':
      case 'dns':
      case 'admin':
      case 'proxy':
      case 'vaultwarden':
        return <ServiceWidget {...commonProps} />;
      
      case 'docker_stats':
        return <DockerWidget title={'Docker'} {...commonProps}  />;
      
      case 'disk_stats':
        return <DiskWidget {...commonProps} />;
      
      case 'weather':
        return <WeatherWidget {...commonProps} />;

      case 'server_stats':
        return <ServerStatsWidget {...commonProps} />;
        
      default:
        return (
          <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs border border-slate-700 rounded-xl">
            Nieznany typ: {item.type}
          </div>
        );
    }
  };

  

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={isKiosk ? { lg: 0 } : { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={isKiosk ? { lg: 12 } : { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100} // Zachowałem Twoje ustawienie wysokości
      margin={[16, 16]}
      
      // Ustawienia przesuwania
      isDraggable={isEditMode}
      isResizable={isEditMode}
      draggableHandle=".grid-drag-handle"
      
      onLayoutChange={(currentLayout, allLayouts) => {
        // 1. Zapisujemy układ do bazy TYLKO w trybie edycji. 
        // Wciskając F12 w normalnym trybie nic się nie zepsuje w pamięci!
        if (isEditMode) {
          // 2. Zawsze priorytetyzujemy układ 'lg' (desktopowy), żeby po zwężeniu
          // i rozszerzeniu okna wszystko miało gdzie wrócić.
          const layoutToSave = allLayouts.lg || currentLayout;
          onLayoutChange(layoutToSave as any);
        }
      }}
    >
      {/* Tutaj tworzymy strukturę Grid > Div > Widget */}
      {layout.map((item: any) => {
        const isHighlighted = highlightedId === item.i;

        return (
          <div 
            key={item.i} 
            data-grid={item}
            id={`widget-${item.i}`}
            className={isEditMode ? "z-10" : "z-0"}
          >
             {/* 2. WEWNĘTRZNY DIV (Nasz bezpieczny kontener do animacji) */}
             <div className={`relative w-full h-full transition-all duration-500 origin-center ${
               isHighlighted ? 'scale-[1.02] z-50' : ''
             }`}>
               
               {/* 3. WARSTWA POŚWIATY */}
               <div
                  className={`absolute -inset-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-[30px] blur-xl transition-opacity duration-500 -z-10 ${
                    isHighlighted ? 'opacity-60' : 'opacity-0'
                  }`}
                />

              {/* 4. WŁAŚCIWY WIDGET */}
              <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/90 backdrop-blur-md shadow-xl">
                 {renderWidget(item)}
              </div>

            </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}