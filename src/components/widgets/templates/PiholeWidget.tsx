import { Shield, Activity, Globe } from 'lucide-react';

export default function PiholeWidget({ data, stats }: any) {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col p-4 rounded-xl border border-slate-700 relative overflow-hidden">
       
       {/* Header */}
       <div className="flex justify-between items-start z-10">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
             <Shield size={20} />
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-400">Status</div>
             <div className="text-xs font-bold text-emerald-400">Aktywny</div>
          </div>
       </div>

       {/* Dane (Mockowane lub z Dockera) */}
       <div className="flex-1 flex flex-col justify-end gap-2 z-10">
          <div className="flex justify-between items-end border-b border-slate-700/50 pb-1">
             <span className="text-[10px] text-slate-500 flex items-center gap-1"><Activity size={10}/> CPU</span>
             <span className="text-sm font-bold text-white">{stats?.cpuUsage || '0%'}</span>
          </div>
          <div className="flex justify-between items-end border-b border-slate-700/50 pb-1">
             <span className="text-[10px] text-slate-500 flex items-center gap-1"><Globe size={10}/> RAM</span>
             <span className="text-sm font-bold text-white">{stats?.memoryUsage || '0MB'}</span>
          </div>
       </div>

       <a href={data.url} target="_blank" className="mt-3 text-center text-xs bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded transition-colors z-10">
          Otwórz Panel
       </a>
    </div>
  );
}