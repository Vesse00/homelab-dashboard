'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Save, ExternalLink } from 'lucide-react';

interface EditWidgetModalProps {
  id: string;
  data: any;
  onClose: () => void;
  onUpdateData?: (id: string, newData: any) => void;
}

export default function EditWidgetModal({ id, data, onClose, onUpdateData }: EditWidgetModalProps) {
  // Stan, by upewnić się, że renderujemy portal tylko po stronie klienta (w przeglądarce)
  const [mounted, setMounted] = useState(false);
  
  const [editedName, setEditedName] = useState(data.name || '');
  const [editedUrl, setEditedUrl] = useState(data.url || '');
  const [editedPublicUrl, setEditedPublicUrl] = useState(data.publicUrl || '');
  
  const [settings, setSettings] = useState({
    authType: data.settings?.authType || 'none',
    apiKey: data.settings?.apiKey || '',
    username: data.settings?.username || '',
    password: data.settings?.password || '',
    statusPage: data.settings?.statusPage || '',
    tailnet: data.settings?.tailnet || ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (onUpdateData) {
      onUpdateData(id, {
        ...data,
        name: editedName,
        url: editedUrl,
        publicUrl: editedPublicUrl,
        settings: settings
      });
    }
    onClose();
  };

  // Jeśli komponent nie jest jeszcze zamontowany na kliencie, nie renderuj nic
  if (!mounted) return null;

  // Cała zawartość modala
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => e.stopPropagation()} 
      onMouseUp={(e) => e.stopPropagation()} 
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
        
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
           <h4 className="text-white font-bold flex items-center gap-2"><Settings size={18} className="text-emerald-400"/> Konfiguracja Kafelka</h4>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        
        {/* Ciało Modalu */}
        <div className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
           
           <div className="space-y-3">
             <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Nazwa wyświetlana</label>
                <input 
                  type="text" 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
             </div>
             
             <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Internal URL (Dla statystyk z serwera)</label>
                <input 
                  type="text" 
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                />
             </div>

             <div>
                <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><ExternalLink size={12}/> Publiczny URL (Opcjonalnie)</label>
                <input 
                  type="text" 
                  value={editedPublicUrl}
                  onChange={(e) => setEditedPublicUrl(e.target.value)}
                  placeholder="np. https://vault.twojadomena.pl"
                  className="w-full bg-black/50 border border-emerald-900/50 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ten adres zostanie otwarty po kliknięciu "Otwórz".</p>
             </div>
           </div>

           {/* Opcje zależne od widgetu */}
           {data.widgetType === 'uptime-kuma' && (
             <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl">
                <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 block">Slug Strony Statusu</label>
                <input 
                  type="text" 
                  value={settings.statusPage}
                  onChange={(e) => handleSettingChange('statusPage', e.target.value)}
                  placeholder="np. default"
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
             </div>
           )}

           {data.widgetType === 'tailscale' && (
             <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tailscale API</h5>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Tailnet (Organizacja)</label>
                  <input 
                    type="text" 
                    value={settings.tailnet}
                    onChange={(e) => handleSettingChange('tailnet', e.target.value)}
                    placeholder="np. user@gmail.com"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">API Key</label>
                  <input 
                    type="password" 
                    value={settings.apiKey}
                    onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                    placeholder="tskey-api-..."
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
             </div>
           )}

           {(!['uptime-kuma', 'tailscale'].includes(data.widgetType || '')) && (
             <div className="border-t border-slate-800 pt-4">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Autoryzacja (Dla statystyk)</label>
                <select 
                  value={settings.authType}
                  onChange={(e) => handleSettingChange('authType', e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none mb-3"
                >
                   <option value="none">Brak (Publiczne API)</option>
                   <option value="apikey">Token / API Key</option>
                   <option value="basic">Login i Hasło (Basic Auth)</option>
                </select>

                {settings.authType === 'apikey' && (
                  <div>
                     <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Klucz API / Token</label>
                     <input 
                       type="password" 
                       value={settings.apiKey}
                       onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                       className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                     />
                  </div>
                )}

                {settings.authType === 'basic' && (
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Login</label>
                       <input 
                         type="text" 
                         value={settings.username}
                         onChange={(e) => handleSettingChange('username', e.target.value)}
                         className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Hasło</label>
                       <input 
                         type="password" 
                         value={settings.password}
                         onChange={(e) => handleSettingChange('password', e.target.value)}
                         className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                       />
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Stopka z przyciskami */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Anuluj</button>
           <button 
             onClick={handleSave}
             className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
           >
             <Save size={16} /> Zapisz
           </button>
        </div>
      </div>
    </div>
  );

  // Używamy Portalu, by wstrzyknąć modal bezpośrednio do <body> strony!
  return createPortal(modalContent, document.body);
}