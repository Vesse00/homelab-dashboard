'use client';

import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
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
}

export default function DashboardGrid({ 
  layout, 
  onLayoutChange, 
  isEditMode, 
  onRemove,
  onUpdateData
}: DashboardGridProps) {

  // Funkcja, która wybiera odpowiedni komponent widgetu
  const renderWidget = (item: any) => {
    // Wspólne właściwości przekazywane do każdego widgetu
    const commonProps = {
      id: item.i,
      isEditMode: isEditMode,
      onRemove: onRemove,
      className: "h-full w-full", // To naprawia rozjeżdżanie się (zajmuje 100% kafelka)
      data: item.data,
      onUpdateData: onUpdateData,
      w: item.w,
      h: item.h,
    };

    switch (item.type) {
      case 'service':
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
        // Fallback dla nieznanych lub starych widgetów
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
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100} // Zachowałem Twoje ustawienie wysokości
      margin={[16, 16]}
      
      // Ustawienia przesuwania
      isDraggable={isEditMode}
      isResizable={isEditMode}
      draggableHandle=".grid-drag-handle"
      
      onLayoutChange={(currentLayout) => onLayoutChange(currentLayout)}
    >
      {/* Tutaj tworzymy strukturę Grid > Div > Widget */}
      {layout.map((item: any) => (
        <div key={item.i} data-grid={item}>
          {renderWidget(item)}
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}