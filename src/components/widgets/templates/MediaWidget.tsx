import { Play, Clapperboard } from 'lucide-react';

export default function MediaWidget({ data }: any) {
  const Icon = data.icon === 'Clapperboard' ? Clapperboard : Play;
  
  return (
    <div className="h-full w-full bg-gradient-to-br from-orange-900/40 to-slate-900 relative flex flex-col items-center justify-center rounded-xl overflow-hidden border border-orange-500/30 group">
       {/* Glow effect */}
       <div className="absolute inset-0 bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-all duration-500"></div>

       <Icon size={48} className="text-orange-400 mb-3 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)] transform group-hover:scale-110 transition-transform" />
       
       <h3 className="text-white font-bold tracking-wider">{data.name}</h3>
       
       <a 
         href={data.url} 
         target="_blank"
         className="absolute bottom-0 left-0 right-0 bg-orange-600/90 hover:bg-orange-500 text-white text-xs font-bold py-2 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300"
       >
         URUCHOM
       </a>
    </div>
  );
}