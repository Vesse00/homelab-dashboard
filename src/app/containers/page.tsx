'use client';

import { useEffect, useState } from 'react';
import ContainerCard from '@/components/ContainerCard'; // Importujemy nasz nowy kafel
import DashboardGrid from '@/components/DashboardGrid';

export default function Home() {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch('/api/containers') // To Twoje stare API, które zwraca listę
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setContainers(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // Odświeżaj listę co 10 sekund
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Homelab Command Center
            </h1>
            <p className="text-slate-500 mt-2">
              Status systemu i monitorowanie kontenerów
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">
              {containers.filter(c => c.State === 'running').length} / {containers.length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">Online</div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-blue-400">
            Łączenie z bazą...
          </div>
        ) : (
          <div className="mt-8">
            <DashboardGrid containers={containers} />
          </div>
        )}
      </div>
    </main>
  );
}