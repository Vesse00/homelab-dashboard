'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Box, 
  Activity, 
  Clock, 
  MoreVertical, 
  ArrowRight,
  LayoutGrid,
  ArrowLeft
} from 'lucide-react';

interface Container {
  id: string;
  shortId: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
}

export default function ContainersPage() {
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pobieranie danych
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const res = await fetch('/api/containers');
        const data = await res.json();
        if (Array.isArray(data)) {
          setContainers(data);
        }
      } catch (error) {
        console.error("Błąd:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
    // Opcjonalnie: odświeżanie co 5s
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtrowanie listy
  const filteredContainers = containers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.image || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.shortId || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-slate-200">
      
      {/* --- Nagłówek ze strzałką powrotu --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl transition-colors group"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <LayoutGrid className="text-blue-500" />
              Twoje Kontenery
            </h1>
            <p className="text-slate-400 mt-1">
              Zarządzaj i monitoruj {containers.length} instancji
            </p>
          </div>
        </div>

        {/* Wyszukiwarka */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Szukaj kontenera..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 w-full md:w-64 transition-colors"
          />
        </div>
      </div>

      {/* Lista / Tabela */}
      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-500">
          Ładowanie listy kontenerów...
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-medium">Nazwa / ID</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Obraz</th>
                  <th className="p-4 font-medium">Uptime</th>
                  <th className="p-4 font-medium text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredContainers.map((container) => (
                  <tr 
                    key={container.id} 
                    onClick={() => router.push(`/containers/${container.id}`)}
                    className="group hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    {/* Nazwa i ID */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${container.state === 'running' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/30 text-slate-500'}`}>
                          <Box size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {container.name}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            {container.shortId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status (Badge) */}
                    <td className="p-4">
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${container.state === 'running' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'}
                      `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${container.state === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        {container.state}
                      </span>
                    </td>

                    {/* Obraz */}
                    <td className="p-4 text-slate-400 text-sm max-w-[200px] truncate" title={container.image}>
                      {container.image}
                    </td>

                    {/* Uptime */}
                    <td className="p-4 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {container.status}
                      </div>
                    </td>

                    {/* Akcje */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Żeby nie uruchomić kliknięcia w wiersz
                          router.push(`/containers/${container.id}`);
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContainers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nie znaleziono kontenerów pasujących do wyszukiwania.
            </div>
          )}
        </div>
      )}
    </div>
  );
}