'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Cpu, HardDrive } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface StatPoint {
  createdAt: string;
  cpu: number;
  memory: number;
}

export default function ContainerDetailsPage() {
  // UWAGA: w Next.js 15 useParams() zwraca params bezpośrednio (hook client-side)
  const params = useParams();
  const router = useRouter();
  const containerId = params?.containerId as string;

  const [data, setData] = useState<StatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerId) return;

    const fetchData = async () => {
      try {
        // Tu używamy Twojego API
        const res = await fetch(`/api/stats/${containerId}`);
        const json = await res.json();
        
        // Formatowanie daty na czytelną godzinę (np. 14:30)
        const formattedData = json.map((item: any) => ({
          ...item,
          displayTime: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }));
        
        setData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Błąd pobierania statystyk", err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Odświeżanie co 5s
    return () => clearInterval(interval);
  }, [containerId]);

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-slate-200">
      {/* Nagłówek i powrót */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Szczegóły Kontenera</h1>
          <p className="text-slate-400 font-mono text-sm">{containerId}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-500">Ładowanie wykresów...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Wykres CPU */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="text-blue-400" />
              <h2 className="text-lg font-semibold">Użycie CPU (%)</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="displayTime" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCpu)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wykres RAM */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <HardDrive className="text-purple-400" />
              <h2 className="text-lg font-semibold">Użycie RAM (MB)</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="displayTime" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#a855f7' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}