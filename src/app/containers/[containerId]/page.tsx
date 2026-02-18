'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Cpu, HardDrive, Play, Square, RotateCcw, Activity, Circle, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface StatPoint {
  createdAt: string;
  cpu: number;
  memory: number;
  displayTime: string;
}

export default function ContainerDetailsPage() {
    const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const containerId = params?.containerId as string;

  const [data, setData] = useState<StatPoint[]>([]);
  const [currentStatus, setCurrentStatus] = useState({ state: 'loading', status: '...' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const handleControl = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/docker/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId, action }),
      });
      if (!res.ok) throw new Error('Action failed');
      
      // Po akcji od razu próbujemy odświeżyć dane
      setTimeout(() => fetchData(), 1000); 
    } catch (err) {
      console.error(err);
      alert("Błąd wykonania akcji");
    } finally {
      setActionLoading(false);
    }
  };

  // Wyciągamy funkcję fetch na zewnątrz, aby móc ją wołać ręcznie (np. po kliknięciu Start)
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/stats/${containerId}`);
      const json = await res.json();
      
      // Obsługa nowego formatu { history, current }
      if (json.history) {
        const formattedData = json.history.map((item: any) => ({
          ...item,
          displayTime: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }));
        setData(formattedData);
      }
      
      if (json.current) {
        setCurrentStatus(json.current);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Błąd pobierania statystyk", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!containerId) return;
    fetchData();
    const interval = setInterval(fetchData, 3000); // Częstsze odświeżanie (3s) dla lepszego feedbacku
    return () => clearInterval(interval);
  }, [containerId]);

  // Pomocnik do kolorów statusu
  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'exited': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'restarting': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        
        {/* Lewa strona: Powrót + Tytuł + Status */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <ArrowLeft />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Szczegóły Kontenera</h1>
              
              {/* STATUS BADGE */}
              {!loading && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${getStatusColor(currentStatus.state)}`}>
                  <div className={`w-2 h-2 rounded-full ${currentStatus.state === 'running' ? 'bg-current animate-pulse' : 'bg-current'}`} />
                  {currentStatus.state}
                </div>
              )}
            </div>
            <p className="text-slate-400 font-mono text-xs md:text-sm mt-1">{containerId}</p>
          </div>
        </div>

        {/* Prawa strona: Panel Sterowania */}
        <div className="flex gap-2 self-start md:self-auto">
           {/* WYŚWIETL GUZIKI TYLKO ADMINOWI */}
           {session?.user?.role === 'ADMIN' ? (
             <>
               <button
                 onClick={() => handleControl('start')}
                 disabled={actionLoading || currentStatus.state === 'running'}
                 className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
               >
                 <Play size={16} fill="currentColor" />
                 <span className="hidden md:inline">Start</span>
               </button>
               
               <button
                 onClick={() => handleControl('stop')}
                 disabled={actionLoading || currentStatus.state !== 'running'}
                 className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-900/20"
               >
                 <Square size={16} fill="currentColor" />
                 <span className="hidden md:inline">Stop</span>
               </button>
    
               <button
                 onClick={() => handleControl('restart')}
                 disabled={actionLoading}
                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
               >
                 <RotateCcw size={16} />
                 <span className="hidden md:inline">Restart</span>
               </button>
             </>
           ) : (
             /* JEŚLI NIE JEST ADMINEM */
             <div className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm font-medium flex items-center gap-2">
               <Shield size={16} />
               <span>Tryb podglądu</span>
             </div>
           )}
        </div>
      </div>

      {/* Wykresy */}
      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-500">Ładowanie danych...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wykres CPU */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Activity size={100} />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="text-blue-400" />
              <div>
                 <h2 className="text-lg font-semibold">Użycie CPU</h2>
                 <p className="text-xs text-slate-400">Ostatnie 20 pomiarów</p>
              </div>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }} itemStyle={{ color: '#3b82f6' }} labelStyle={{ color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wykres RAM */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <HardDrive size={100} />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <HardDrive className="text-purple-400" />
              <div>
                 <h2 className="text-lg font-semibold">Użycie RAM</h2>
                 <p className="text-xs text-slate-400">W megabajtach (MB)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                   <defs>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="displayTime" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit=" MB" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }} itemStyle={{ color: '#a855f7' }} labelStyle={{ color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={3} fill="url(#colorMem)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}