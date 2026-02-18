'use client';

import { useState, useEffect } from 'react';
import { X, Radar, Check, Server, Globe } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DiscoveredService {
  id: string;
  name: string;
  icon: string;
  ip: string;
  port: number;
  color: string;
  selected: boolean;
}

interface ServiceDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (services: any[]) => void;
  initialServices: any[]; // <--- NOWY PROP: Dane przekazane z page.tsx
}

export default function ServiceDiscoveryModal({ isOpen, onClose, onImport, initialServices }: ServiceDiscoveryModalProps) {
  const [services, setServices] = useState<DiscoveredService[]>([]);

  // Gdy otwieramy okno i dostajemy nowe dane -> mapujemy je do edycji
  useEffect(() => {
    if (isOpen && initialServices.length > 0) {
      const mapped = initialServices.map((s: any, idx: number) => {
        let ip = 'localhost';
        let port = 80;

        try {
          const urlObj = new URL(s.url);
          ip = urlObj.hostname;
          port = parseInt(urlObj.port) || 80;
        } catch (e) {}

        return {
          id: `scan-${idx}-${Date.now()}`,
          name: s.name,
          icon: s.icon,
          ip: ip,
          port: port,
          color: s.color,
          selected: true // Domyślnie zaznaczamy wszystko co znaleźliśmy teraz
        };
      });
      setServices(mapped);
    }
  }, [isOpen, initialServices]);

  const handleImport = () => {
    const finalData = services
      .filter(s => s.selected)
      .map(s => ({
        name: s.name,
        icon: s.icon,
        url: `http://${s.ip}:${s.port}`, // Składamy URL z Twoim portem
        color: s.color,
        status: 'running'
      }));
      
    onImport(finalData);
    onClose();
  };

  const updatePort = (id: string, newPort: string) => {
    setServices(prev => prev.map(s => 
        s.id === id ? { ...s, port: parseInt(newPort) || 0 } : s
    ));
  };

  const toggleSelect = (id: string) => {
    setServices(prev => prev.map(s => 
        s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radar className="text-emerald-400" /> Konfiguracja Usług
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Znaleziono {services.length} usług. Sprawdź porty przed dodaniem.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {services.map((service) => {
             // @ts-ignore
             const Icon = LucideIcons[service.icon] || LucideIcons.Box;
             return (
               <div key={service.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${service.selected ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                  <div 
                    onClick={() => toggleSelect(service.id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer ${service.selected ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}
                  >
                    {service.selected && <Check size={14} className="text-white" />}
                  </div>

                  <div className={`p-3 rounded-lg bg-slate-800 text-slate-300`}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1">
                     <h3 className="font-bold text-white">{service.name}</h3>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Server size={10} /> {service.ip}
                     </div>
                  </div>

                  <div className="flex flex-col items-end">
                     <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Port</label>
                     <input 
                       type="number" 
                       value={service.port}
                       onChange={(e) => updatePort(service.id, e.target.value)}
                       className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-sm text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                     />
                  </div>
               </div>
             );
           })}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
           <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Anuluj</button>
           <button 
             onClick={handleImport}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2"
           >
             <Globe size={16} />
             Dodaj Widgety
           </button>
        </div>
      </div>
    </div>
  );
}