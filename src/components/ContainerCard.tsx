'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface Props {
  container: any;
}

export default function ContainerCard({ container }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Pobieramy historię
    fetch(`/api/stats/${container.Id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // MAPOWANIE: Zamieniamy "running" na 1, resztę na 0
          const chartData = data.map((item: any) => ({
            ...item,
            numericState: item.state === 'running' ? 1 : 0, // To jest kluczowe dla wykresu!
            displayTime: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setHistory(chartData);
        }
      });
  }, [container.Id]);

  const isRunning = container.State === 'running';

  return (
    <div className={`
      relative overflow-hidden rounded-xl border p-4 transition-all duration-300
      ${isRunning 
        ? 'bg-slate-800/40 border-slate-700/50 hover:border-emerald-500/50' 
        : 'bg-red-900/10 border-red-900/30 hover:border-red-500/50'}
    `}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2 z-10 relative">
        <div className="overflow-hidden">
          <h3 className="font-bold text-lg text-slate-100 truncate pr-2" title={container.Names[0]}>
            {container.Names[0].replace('/', '')}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {container.Image.split(':')[0]}
          </p>
        </div>
        <div className={`
          shrink-0 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] mt-1.5
          ${isRunning ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}
        `} />
      </div>

      {/* Wykres */}
      <div className="h-16 mt-4 -mx-2 -mb-3 opacity-60 hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            {/* Ukryta oś Y, ale ustawiamy domenę 0-1, żeby linia była stabilna */}
            <YAxis domain={[0, 1]} hide />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              labelFormatter={(label, payload) => payload[0]?.payload.displayTime}
              formatter={(value: any) => [value === 1 ? 'Online' : 'Offline', 'Status']}
            />
            <Line 
              type="step" // "step" robi ładne kwadratowe schodki jak w systemach monitoringu
              dataKey="numericState" 
              stroke={isRunning ? '#10b981' : '#ef4444'} 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
        <span>{container.Status}</span>
        <span>UPTIME</span>
      </div>
    </div>
  );
}