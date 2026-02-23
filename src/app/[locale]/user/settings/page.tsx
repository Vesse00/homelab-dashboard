'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Shield, KeyRound, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(false);

  // Stany formularza
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST', // Upewnij się, że używasz POST zgodnie z Twoim najnowszym API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfile', name, email }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Kluczowy krok: Wymuszenie aktualizacji sesji w NextAuth
        // Przekazujemy nowe dane, aby Navbar od razu je zauważył
        await update({
          ...session,
          user: {
            ...session?.user,
            name: name,
            email: email
          }
        });

        toast.success(data.message || "Profil zaktualizowany!");
        
        // 2. Odświeżenie strony, aby Server Components pobrały nowe dane
        window.location.reload(); 
      } else {
        toast.error(data.error || "Wystąpił błąd");
      }
    } catch (err) {
      toast.error("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      alert(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } else {
      alert(data.error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  return (
    <div className="min-h-screen p-6 relative">
      {/* Ozdobne tła */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <User className="text-blue-500" size={32} />
            Ustawienia Konta
          </h1>
          <p className="text-slate-400 text-sm mt-1">Dostosuj swoje dane i zabezpiecz konto.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu boczne */}
          <div className="w-full md:w-64 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            >
              <User size={18} /> Profil
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            >
              <Shield size={18} /> Bezpieczeństwo
            </button>
          </div>

          {/* Główny kontener formularzy */}
          <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-500">
            
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Informacje o profilu</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nazwa użytkownika</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-slate-500" /></div>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Adres E-mail</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-slate-500" /></div>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Zapisz zmiany</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Zmiana hasła</h2>
                
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Obecne hasło</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound size={16} className="text-slate-500" /></div>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="••••••••" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nowe hasło</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound size={16} className="text-slate-500" /></div>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-start">
                  <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Zaktualizuj hasło</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}