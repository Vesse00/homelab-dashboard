'use client';

import { User, Lock, Mail, Globe, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Ustawienia Konta</h1>
        <p className="text-slate-500">Zarządzaj swoim profilem i bezpieczeństwem.</p>
      </header>

      <div className="space-y-6">
        {/* Sekcja: Profil */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <User size={32} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Administrator</h2>
              <p className="text-sm text-slate-500">admin@homelab.local</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400 ml-1">Nazwa użytkownika</label>
              <input type="text" placeholder="Admin" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 ml-1">Email</label>
              <input type="email" placeholder="admin@homelab.local" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
        </div>

        {/* Sekcja: Bezpieczeństwo */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock size={20} className="text-blue-400" /> Bezpieczeństwo
          </h3>
          <div className="space-y-4">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded-xl transition-all">
              Zmień hasło
            </button>
            <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-blue-400" />
                <div>
                  <p className="text-sm font-medium">Konto Google</p>
                  <p className="text-xs text-slate-500">Niepodłączone</p>
                </div>
              </div>
              <button className="text-sm text-blue-400 hover:underline">Podłącz konto</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}