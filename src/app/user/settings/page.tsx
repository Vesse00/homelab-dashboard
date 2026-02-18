'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, Save, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- NOWY IMPORT

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  // Stany formularza
  const [name, setName] = useState(session?.user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Stan ładowania
  const [loading, setLoading] = useState(false);
  // USUNIĘTO: const [message, setMessage] ... (niepotrzebne)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Używamy toast.promise dla lepszego efektu (loading -> success/error automatycznie)
    const promise = fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wystąpił błąd");
      return data;
    });

    try {
      // Magia toast.promise: sam obsłuży ładowanie, sukces i błąd
      const data = await toast.promise(promise, {
        loading: 'Zapisywanie zmian...',
        success: (data) => data.message || 'Zapisano pomyślnie!',
        error: (err) => err.message,
      });

      // Logika po sukcesie
      if (name !== session?.user?.name) {
        await update({ name }); 
      }
      setCurrentPassword('');
      setNewPassword('');

    } catch (err) {
      // Błędy są już obsłużone przez toast.promise, ale catch jest potrzebny dla Reacta
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Tutaj używamy zwykłego window.confirm, bo to krytyczna akcja
    if (!confirm("Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna.")) return;

    const toastId = toast.loading("Usuwanie konta...");

    try {
      const res = await fetch('/api/user/settings', { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Konto usunięte", { id: toastId });
      signOut({ callbackUrl: '/login' });

    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        
        {/* Nagłówek */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Ustawienia Konta</h1>
            <p className="text-slate-400 text-sm">Zarządzaj swoim profilem i bezpieczeństwem</p>
          </div>
        </div>

        {/* Formularz */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sekcja: Profil */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <User size={20} className="text-blue-500"/> Profil
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input 
                  type="text" 
                  value={session?.user?.email || ''} 
                  disabled 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nazwa wyświetlana</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Sekcja: Bezpieczeństwo */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Lock size={20} className="text-emerald-500"/> Zmiana Hasła
              </h2>
              <p className="text-xs text-slate-500">Wypełnij tylko jeśli chcesz zmienić hasło.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nowe hasło</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Obecne hasło</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={!newPassword} 
                    placeholder={newPassword ? "Wymagane do potwierdzenia" : "••••••••"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Przycisk Zapisz */}
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? 'Zapisywanie...' : <><Save size={18}/> Zapisz zmiany</>}
              </button>
            </div>

          </form>
        </div>

        {/* Strefa Niebezpieczna */}
        <div className="mt-12 border-t border-slate-800 pt-8">
           <h3 className="text-rose-500 font-bold mb-2">Strefa Niebezpieczna</h3>
           <div className="flex items-center justify-between bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl">
              <div>
                <p className="text-slate-300 text-sm font-medium">Usuń konto</p>
                <p className="text-slate-500 text-xs">Trwale usuwa konto i wszystkie przypisane ustawienia.</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-transparent border border-rose-700 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={16}/> Usuń
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}