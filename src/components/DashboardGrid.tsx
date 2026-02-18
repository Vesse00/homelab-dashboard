'use client';

import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ReactNode } from 'react';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: ReactNode[];
  layout: any[];
  onLayoutChange: (layout: any) => void;
  isEditMode: boolean;
}

export default function DashboardGrid({ children, layout, onLayoutChange, isEditMode }: DashboardGridProps) {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }} // Używamy tego samego layoutu dla dużych ekranów (można rozbudować o inne breakpointy)
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100} // Wysokość pojedynczego wiersza w px
      isDraggable={isEditMode}
      isResizable={isEditMode}
      onLayoutChange={(currentLayout) => onLayoutChange(currentLayout)}
      margin={[16, 16]} // Odstępy między kafelkami
      draggableHandle=".drag-handle" // Tylko ten element (np. nagłówek) pozwala przesuwać widget
    >
      {children}
    </ResponsiveGridLayout>
  );
}