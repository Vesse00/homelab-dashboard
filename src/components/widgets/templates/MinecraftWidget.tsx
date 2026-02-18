import { ExternalLink, Gamepad2 } from 'lucide-react';

export default function MinecraftWidget({ data, stats }: any) {
  return (
    <div className="h-full w-full bg-[#1a1a1a] relative flex flex-col items-center justify-center border-2 border-[#3a3a3a] rounded-xl overflow-hidden">
       {/* Tło stylizowane na ziemię z Minecrafta */}
       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
       
       <div className="z-10 flex flex-col items-center">
         <Gamepad2 size={40} className="text-[#55cdfc] drop-shadow-md mb-2" />
         <h3 className="font-bold text-white font-mono text-lg text-shadow">{data.name}</h3>
         
         <div className="mt-2 px-3 py-1 bg-black/50 rounded text-xs text-green-400 font-mono border border-green-900 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Online
         </div>

         {/* Wyświetlamy zużycie RAM z Dockera jeśli dostępne */}
         {stats && (
             <div className="mt-2 text-[10px] text-slate-400 font-mono">
                RAM: {stats.memoryUsage}
             </div>
         )}
       </div>
    </div>
  );
}