import { Globe, ArrowRightLeft, Route } from 'lucide-react';

export default function ProxyWidget({ data }: any) {
  return (
    <div className="h-full w-full bg-slate-800 relative flex flex-col items-center justify-center rounded-xl border-t-4 border-emerald-500 overflow-hidden">
       
       <div className="absolute inset-0 bg-emerald-500/5"></div>
       
       <div className="z-10 flex items-center gap-2 mb-2 text-emerald-400">
          <Globe size={20} />
          <ArrowRightLeft size={16} className="animate-pulse" />
          <Route size={20} />
       </div>
       
       <h3 className="z-10 font-bold text-white text-center">{data.name}</h3>
       <p className="z-10 text-[10px] text-emerald-500/80 font-mono mt-1">GATEWAY ACTIVE</p>

       <a 
         href={data.url} 
         target="_blank"
         className="absolute bottom-0 w-full bg-slate-900/80 hover:bg-emerald-600 text-slate-300 hover:text-white text-[10px] font-bold py-1.5 text-center transition-colors"
       >
         ZARZĄDZAJ
       </a>
    </div>
  );
}