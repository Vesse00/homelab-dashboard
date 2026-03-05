'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Save, ExternalLink, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EditWidgetModalProps {
  id: string;
  data: any;
  isAdmin?: boolean; 
  onClose: () => void;
  onUpdateData?: (id: string, newData: any) => void;
}

export default function EditWidgetModal({ id, data, isAdmin, onClose, onUpdateData }: EditWidgetModalProps) {
  const t = useTranslations('EditWidgetModal');
  const [mounted, setMounted] = useState(false);
  
  const [editedName, setEditedName] = useState(data.name || '');
  const [editedPublicUrl, setEditedPublicUrl] = useState(data.publicUrl || '');
  
  let initialProtocol = 'http';
  let initialIp = '';
  let initialPort = 80;

  try {
    if (data.url) {
      const urlToParse = data.url.startsWith('http') ? data.url : `http://${data.url}`;
      const parsed = new URL(urlToParse);
      initialProtocol = parsed.protocol.replace(':', '');
      initialIp = parsed.hostname;
      initialPort = parsed.port ? parseInt(parsed.port) : (initialProtocol === 'https' ? 443 : 80);
    }
  } catch(e) { }

  const [protocol, setProtocol] = useState(initialProtocol);
  const [ip, setIp] = useState(initialIp);
  const [port, setPort] = useState(initialPort);
  
  const [settings, setSettings] = useState({
    authType: data.settings?.authType || 'none',
    apiKey: data.settings?.apiKey || '',
    username: data.settings?.username || '',
    password: data.settings?.password || '',
    statusPage: data.settings?.statusPage || '',
    tailnet: data.settings?.tailnet || ''
  });

  useEffect(() => { setMounted(true); }, []);

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const reconstructedUrl = `${protocol}://${ip}${port ? `:${port}` : ''}`;

    // Zawsze zapisujemy konfigurację lokalnie dla usera (nawet te wartości, których nie edytował, po prostu zostaną nienaruszone)
    if (onUpdateData) {
      onUpdateData(id, {
        ...data,
        name: editedName,
        url: reconstructedUrl,
        publicUrl: editedPublicUrl,
        settings: settings
      });
    }

    // TYLKO ADMIN może zaktualizować globalną bazę danych z tego miejsca
    if (isAdmin && data.serviceId) {
      try {
         await fetch('/api/services/inventory', {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             id: data.serviceId,
             name: editedName,
             protocol: protocol,
             ip: ip,
             port: port,
             publicUrl: editedPublicUrl,
             authType: settings.authType,
             apiKey: settings.apiKey,
             username: data.widgetType === 'uptime-kuma' ? settings.statusPage : 
                       data.widgetType === 'tailscale' ? settings.tailnet : 
                       settings.username,
             password: settings.password
           })
         });
      } catch(e) {
         console.error("Błąd aktualizacji bazy", e);
      }
    }
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200" onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
           <h4 className="text-white font-bold flex items-center gap-2"><Settings size={18} className="text-emerald-400"/> Ustawienia Kafelka</h4>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
           <div className="space-y-3">
             
             {/* POLE NAZWY WIDOCZNE DLA KAŻDEGO */}
             <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('displayName')}</label>
                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors" />
             </div>
             
             {/* SEKCJĘ POŁĄCZENIA ORAZ PUBLIC URL UKRYWAMY DLA ZWYKŁYCH UŻYTKOWNIKÓW */}
             {isAdmin && (
               <>
                 <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Server size={12}/> {t('internalUrl')} (Global)</label>
                    <div className="flex gap-2">
                      <select className="bg-black/50 border border-slate-700 rounded-lg px-3 text-sm text-white focus:border-blue-500 outline-none transition-colors cursor-pointer" value={protocol} onChange={e => setProtocol(e.target.value)}>
                        <option value="http">HTTP</option><option value="https">HTTPS</option>
                      </select>
                      <input className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono transition-colors" value={ip} onChange={e => setIp(e.target.value)} />
                      <input className="w-20 bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:border-blue-500 outline-none font-mono text-center transition-colors" value={port} type="number" onChange={e => setPort(parseInt(e.target.value) || 0)} />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><ExternalLink size={12}/> {t('publicUrl')}</label>
                    <input type="text" value={editedPublicUrl} onChange={(e) => setEditedPublicUrl(e.target.value)} placeholder={t('publicUrlPlaceholder')} className="w-full bg-black/50 border border-emerald-900/50 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors" />
                 </div>
               </>
             )}
           </div>

           {/* UPTIME KUMA - WIDOCZNE DLA KAŻDEGO */}
           {data.widgetType === 'uptime-kuma' && (
             <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl">
                <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 block">{t('statusPageSlug')}</label>
                <input type="text" value={settings.statusPage} onChange={(e) => handleSettingChange('statusPage', e.target.value)} placeholder={t('statusPagePlaceholder')} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors" />
             </div>
           )}

           {/* TAILSCALE - TYLKO DLA ADMINA */}
           {isAdmin && data.widgetType === 'tailscale' && (
             <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('tailscaleApi')}</h5>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('tailnet')}</label>
                  <input type="text" value={settings.tailnet} onChange={(e) => handleSettingChange('tailnet', e.target.value)} placeholder={t('tailnetPlaceholder')} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('apiKey')}</label>
                  <input type="password" value={settings.apiKey} onChange={(e) => handleSettingChange('apiKey', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
             </div>
           )}

           {/* AUTORYZACJA - TYLKO DLA ADMINA */}
           {isAdmin && (!['uptime-kuma', 'tailscale'].includes(data.widgetType || '')) && (
             <div className="border-t border-slate-800 pt-4">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">{t('auth')} (Global)</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['none', 'apikey', 'basic'].map(type => (
                    <button key={type} onClick={() => handleSettingChange('authType', type)} className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${settings.authType === type ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-black/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                      {type === 'none' ? t('authNone') : type === 'apikey' ? t('authApiKey') : t('authBasic')}
                    </button>
                  ))}
                </div>
                {settings.authType === 'apikey' && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                     <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('apiKey')}</label>
                     <input type="password" value={settings.apiKey} onChange={(e) => handleSettingChange('apiKey', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                )}
                {settings.authType === 'basic' && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                     <div>
                       <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('login')}</label>
                       <input type="text" value={settings.username} onChange={(e) => handleSettingChange('username', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors" />
                     </div>
                     <div>
                       <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{t('password')}</label>
                       <input type="password" value={settings.password} onChange={(e) => handleSettingChange('password', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors" />
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">{t('btnCancel')}</button>
           <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-md shadow-blue-900/20">
             <Save size={16} /> {t('btnSave')}
           </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}