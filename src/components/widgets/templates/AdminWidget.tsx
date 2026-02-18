import { Box, Settings, Cpu } from 'lucide-react';

export default function AdminWidget({ data, stats }: any) {
  return (
    <div className="h-full w-full bg-slate-900 relative flex flex-col p-4 rounded-xl border border-blue-500/30 overflow-hidden group">
       {/* Tło techniczne */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(30,58,138,0.1)_2px,transparent_2px)] bg-[size:20px_20px]"></div>
       
       <div className="z-10 flex justify-between items-start">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
             <Box size={24} />
          </div>
          {/* Status badge */}
          <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/50 text-[10px] text-blue-400 font-mono">
             SYSTEM
          </div>
       </div>

       <div className="z-10 mt-auto">
         <h3 className="text-slate-100 font-bold text-lg leading-tight">{data.name}</h3>
         <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Cpu size={10}/> {stats?.cpuUsage || '0%'}</span>
            <span className="flex items-center gap-1"><Settings size={10}/> Admin</span>
         </div>
       </div>

       <a 
         href={data.url} 
         target="_blank"
         className="absolute inset-0 z-20 group-hover:bg-blue-600/10 transition-colors"
       />
    </div>
  );
}