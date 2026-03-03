'use client';

import { useState } from 'react';
import { X, Save, Lock, Globe, Server } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceEditModal({ service, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({
    protocol: service.protocol || 'http',
    ip: service.ip,
    port: service.port,
    publicUrl: service.publicUrl || '',
    authType: service.authType || 'none',
    apiKey: service.apiKey || '',
    username: service.username || '',
    password: service.password || ''
  });

  const handleSave = async () => {
    try {
      const res = await fetch('/api/services/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, ...formData })
      });
      if (!res.ok) throw new Error('Update failed');
      
      toast.success('Zaktualizowano usługę');
      onUpdate(); 
      onClose();
    } catch (e) {
      toast.error('Błąd aktualizacji');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="font-bold text-white flex items-center gap-2">
            Edycja: <span className="text-blue-400">{service.name}</span>
          </h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] bg-slate-950/20">
          
          {/* Adres Lokalny */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1 ml-1"><Server size={12}/> Adres Lokalny (Docker/IP)</label>
            <div className="flex gap-2">
              <select 
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-white focus:border-blue-500 outline-none"
                value={formData.protocol}
                onChange={e => setFormData({...formData, protocol: e.target.value})}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
              <input 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                value={formData.ip}
                onChange={e => setFormData({...formData, ip: e.target.value})}
                placeholder="192.168.x.x"
              />
              <input 
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:border-blue-500 outline-none font-mono text-center"
                value={formData.port}
                type="number"
                onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* Publiczny URL */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1 ml-1"><Globe size={12}/> Publiczny URL (Opcjonalne)</label>
            <input 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-blue-300 placeholder-slate-600 focus:border-blue-500 outline-none"
              value={formData.publicUrl}
              onChange={e => setFormData({...formData, publicUrl: e.target.value})}
              placeholder="np. portainer.mojadomena.pl"
            />
            <p className="text-[10px] text-slate-500 ml-1">Jeśli wypełnione, widget otworzy ten link po kliknięciu.</p>
          </div>

          {/* Autoryzacja */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1 ml-1"><Lock size={12}/> Autoryzacja API (Statystyki)</label>
            
            <div className="grid grid-cols-3 gap-2">
              {['none', 'apikey', 'basic'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({...formData, authType: type})}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    formData.authType === type 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {type === 'none' ? 'Brak' : type === 'apikey' ? 'Token / API Key' : 'Login + Hasło'}
                </button>
              ))}
            </div>

            {formData.authType === 'apikey' && (
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                placeholder="Wklej API Key / Token tutaj..."
                value={formData.apiKey}
                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                type="password"
              />
            )}

            {formData.authType === 'basic' && (
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Użytkownik"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
                <input 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Hasło"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Anuluj</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
            <Save size={16} /> Zapisz Zmiany
          </button>
        </div>

      </div>
    </div>
  );
}