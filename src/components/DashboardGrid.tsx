'use client';

import { ReactNode } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: ReactNode;
  layout: any[];
  onLayoutChange: (layout: any[]) => void;
  isEditMode: boolean;
}

export default function DashboardGrid({ 
  children, 
  layout, 
  onLayoutChange, 
  isEditMode 
}: DashboardGridProps) {
  
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      margin={[16, 16]}
      
      // KLUCZOWE USTAWIENIA PRZESUWANIA
      isDraggable={isEditMode}
      isResizable={isEditMode}
      draggableHandle=".grid-drag-handle" // Musi pasować do klasy w widgetach
      
      // Zapobiega konfliktom przy skalowaniu
      useCSSTransforms={true} 
      preventCollision={false}
      
      onLayoutChange={(currentLayout) => onLayoutChange(currentLayout)}
    >
      {children}
    </ResponsiveGridLayout>
  );
}