'use client';

import { useMemo, useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ContainerCard from './ContainerCard';

// To sprawia, że grid dopasowuje się do szerokości ekranu
const ResponsiveGridLayout = WidthProvider(Responsive);

interface Props {
  containers: any[];
}

export default function DashboardGrid({ containers }: Props) {
  // Stan na layout (układ kafelków)
  const [layout, setLayout] = useState<any>([]);
  // Czy komponent już się załadował w przeglądarce (żeby uniknąć błędów SSR)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Próbujemy wczytać zapisany układ z pamięci przeglądarki
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout));
    }
  }, []);

  // Generujemy domyślny układ, jeśli nie ma zapisanego lub doszły nowe kontenery
  const currentLayout = useMemo(() => {
    return containers.map((container, index) => {
      // Sprawdzamy, czy ten kontener ma już zapisaną pozycję
      const savedItem = layout.find((l: any) => l.i === container.Id);
      
      if (savedItem) return savedItem;

      // Jeśli nie, układamy je po kolei (3 kolumny)
      return {
        i: container.Id,
        x: (index % 3) * 4,
        y: Math.floor(index / 3) * 4,
        w: 4, // Szerokość (na 12 kolumn gridu)
        h: 4, // Wysokość
        minW: 3,
        minH: 3
      };
    });
  }, [containers, layout]);

  // Funkcja zapisująca układ po każdym przesunięciu
  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
  };

  if (!mounted) return null;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: currentLayout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={50} // Wysokość pojedynczej kratki w pikselach
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag-handle" // Tylko nagłówek będzie służył do przesuwania (opcjonalne)
      isDraggable={true}
      isResizable={true}
      margin={[16, 16]}
    >
      {containers.map((container) => (
        <div key={container.Id} className="h-full">
           {/* Przekazujemy styl height: 100% do karty, żeby wypełniała grid */}
          <div className="h-full w-full">
            <ContainerCard container={container} />
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}